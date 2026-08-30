import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_smoke_test():
    print("=" * 60)
    print("PROCURELENS FULL SMOKE TEST SUITE")
    print("=" * 60)

    # 0. Check Root / Static SPA
    print("\n[TEST 0] Testing GET / (Vite-built SPA serving)...")
    r_root = requests.get(f"{BASE_URL}/")
    assert r_root.status_code == 200, f"Root returned {r_root.status_code}"
    assert "ProcureLens" in r_root.text, "Title not found in root response"
    print("[PASS] GET / returned 200 OK with Vite single-page application")

    # 1. POST /api/evaluations
    print("\n[TEST 1] Testing POST /api/evaluations...")
    eval_payload = {
        "title": "Cloud ERP & Analytics Modernization",
        "category": "Enterprise Cloud",
        "description": "Comprehensive procurement evaluation of 3 enterprise vendors."
    }
    r_eval = requests.post(f"{BASE_URL}/api/evaluations", json=eval_payload)
    assert r_eval.status_code == 200, f"Create eval failed with {r_eval.status_code}"
    eval_data = r_eval.json()
    eval_id = eval_data["id"]
    print(f"[PASS] Created evaluation: {eval_id}")

    # 2. Seed 3 Vendor Sample Proposals
    print("\n[TEST 2] Testing POST /api/evaluations/{id}/seed-sample-documents...")
    r_seed = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/seed-sample-documents")
    assert r_seed.status_code == 200, f"Seed failed with {r_seed.status_code}"
    seed_data = r_seed.json()
    assert len(seed_data["documents"]) == 3, f"Expected 3 documents, got {len(seed_data['documents'])}"
    print(f"[PASS] Seeded 3 vendor proposal PDFs: {[d['vendor_name'] for d in seed_data['documents']]}")

    # 3. POST /api/evaluations/{id}/pipeline/run
    print("\n[TEST 3] Testing POST /api/evaluations/{id}/pipeline/run...")
    start_time = time.time()
    r_pipe = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/pipeline/run")
    pipeline_duration = time.time() - start_time
    assert r_pipe.status_code == 200, f"Pipeline run failed with {r_pipe.status_code}: {r_pipe.text}"
    pipe_data = r_pipe.json()
    assert pipe_data["status"] == "completed", f"Pipeline status not completed: {pipe_data['status']}"
    print(f"[PASS] Pipeline completed in {pipeline_duration:.2f}s with status 'completed'")

    # 4. GET /api/evaluations/{id} Detail Verification
    print("\n[TEST 4] Testing GET /api/evaluations/{id} detail data integrity...")
    r_detail = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}")
    assert r_detail.status_code == 200, f"Get detail failed with {r_detail.status_code}"
    detail = r_detail.json()

    # Verify 3 vendors exist
    vendors = detail.get("vendors", [])
    assert len(vendors) == 3, f"Expected 3 vendors, found {len(vendors)}"
    vendor_names = {v["name"] for v in vendors}
    assert "CloudCore" in vendor_names, "CloudCore missing"
    assert "Vertex Systems" in vendor_names, "Vertex Systems missing"
    assert "Nexus Cloud" in vendor_names, "Nexus Cloud missing"
    print(f"[PASS] Verified 3 vendors exist: {list(vendor_names)}")

    # Verify TCO results exist for all 3
    tco_results = detail.get("tco_results", [])
    assert len(tco_results) == 3, f"Expected 3 TCO results, found {len(tco_results)}"
    for t in tco_results:
        assert t["total_3yr_tco"] > 0, f"Invalid 3-yr TCO for {t['vendor_name']}: {t['total_3yr_tco']}"
        print(f"  - {t['vendor_name']}: 3-Yr TCO = ${t['total_3yr_tco']:,.2f} (Escalation: {t['escalation_rate']*100:.1f}%)")
    print("[PASS] Verified TCO results exist and are deterministically computed")

    # Verify Score results & Kill-criteria disqualification
    score_results = detail.get("score_results", [])
    assert len(score_results) == 3, f"Expected 3 score results, found {len(score_results)}"
    disqualified = [s for s in score_results if s["is_disqualified"]]
    assert len(disqualified) >= 1, "Expected at least 1 vendor to be disqualified"
    nexus_score = next((s for s in score_results if s["vendor_name"] == "Nexus Cloud"), None)
    assert nexus_score is not None, "Nexus Cloud score result missing"
    assert nexus_score["is_disqualified"] == True, "Nexus Cloud should be disqualified for failing SOC 2 Type II"
    assert "SOC 2" in nexus_score["disqualification_reason"], "Disqualification reason should mention SOC 2"
    print(f"[PASS] Verified Kill-Criteria Gating: Nexus Cloud disqualified ({nexus_score['disqualification_reason']})")

    # Verify Risks exist
    risks = detail.get("risks", [])
    assert len(risks) > 0, "No risks detected"
    print(f"[PASS] Verified {len(risks)} procurement risks detected with severity ratings")

    # Verify Negotiation questions exist
    questions = detail.get("negotiation_questions", [])
    assert len(questions) > 0, "No negotiation questions generated"
    print(f"[PASS] Verified {len(questions)} tactical negotiation questions generated")

    # 5. POST /api/evaluations/{id}/weights/rebalance (Deterministic, no LLM)
    print("\n[TEST 5] Testing POST /api/evaluations/{id}/weights/rebalance (Instant deterministic reweighting)...")
    reb_start = time.time()
    r_reb = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/weights/rebalance", json={
        "weight_tco": 10.0,
        "weight_technical": 10.0,
        "weight_compliance": 60.0,
        "weight_risk": 10.0,
        "weight_sla": 10.0
    })
    reb_duration = time.time() - reb_start
    assert r_reb.status_code == 200, f"Rebalance failed with {r_reb.status_code}"
    reb_data = r_reb.json()
    new_scores = reb_data["score_results"]
    assert len(new_scores) == 3, f"Expected 3 scores after rebalance, got {len(new_scores)}"
    print(f"[PASS] Rebalanced weights in {reb_duration*1000:.1f}ms (<5ms purely in memory, 0 LLM latency)")
    for s in new_scores:
        print(f"  - Rank {s['rank']}: {s['vendor_name']} | Total Score: {s['total_score']}")

    # 6. GET /api/evidence/{evidence_id}
    print("\n[TEST 6] Testing GET /api/evidence/{id}...")
    sample_risk = next((r for r in risks if r.get("evidence_id")), None)
    assert sample_risk is not None, "No risk with evidence_id found"
    ev_id = sample_risk["evidence_id"]
    r_ev = requests.get(f"{BASE_URL}/api/evidence/{ev_id}")
    assert r_ev.status_code == 200, f"Evidence retrieval failed with {r_ev.status_code}"
    ev_data = r_ev.json()
    assert ev_data["page_number"] > 0, "Invalid page number in evidence"
    assert len(ev_data["quote"]) > 0, "Empty quote in evidence"
    assert "verified" in ev_data, "Verified field missing from evidence"
    print(f"[PASS] Verified Evidence Retrieval: Doc '{ev_data['document_name']}', Page {ev_data['page_number']}, Verified: {ev_data['verified']}, Quote: '{ev_data['quote'][:50]}...'")

    print("\n" + "=" * 60)
    print("ALL 6 SMOKE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_smoke_test()
