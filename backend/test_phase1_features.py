import sys
import time
import json
import requests
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_phase1():
    results = {}
    print("=" * 70)
    print("PROCURELENS PHASE 1 WINNING-LEVEL ENHANCEMENTS TEST SUITE")
    print("=" * 70)

    # 1. Reset and Seed Demo with Phase 1 data
    print("\n--- [TEST 1] DEMO SEED & INGESTION ---")
    r_reset = requests.post(f"{BASE_URL}/api/demo/reset")
    assert r_reset.status_code == 200, f"Reset failed: {r_reset.text}"
    
    r_seed = requests.post(f"{BASE_URL}/api/demo/seed")
    assert r_seed.status_code == 200, f"Seed failed: {r_seed.text}"
    seed_data = r_seed.json()
    eval_id = seed_data["evaluation_id"]
    print(f"[PASS] Evaluation seeded: '{eval_id}'")
    results["demo_seed"] = "PASS"

    # Fetch detail
    detail = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    vendors = detail["vendors"]
    v_map = {v["name"]: v["id"] for v in vendors}

    # -------------------------------------------------------------
    # 2. FEATURE 1: VENDOR RED-TEAM TESTS
    # -------------------------------------------------------------
    print("\n--- [TEST 2] FEATURE 1: VENDOR RED-TEAM RISKS ---")
    try:
        r_rt = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/red-team")
        assert r_rt.status_code == 200
        rt_data = r_rt.json()
        risks = rt_data["risks"]
        summary = rt_data["summary"]

        print(f"  * Total Red-Team Risks: {summary['total']} (Critical: {summary['critical']}, High: {summary['high']}, Medium: {summary['medium']}, Low: {summary['low']})")
        assert summary["critical"] >= 1, "Expected at least 1 critical risk (Nexus SOC2)"
        assert summary["high"] >= 2, "Expected at least 2 high risks (Vertex 7% escalator, 3-mo liability)"

        # Check Vertex specific risks
        v_vertex_id = v_map["Vertex Systems"]
        r_vx = requests.get(f"{BASE_URL}/api/vendors/{v_vertex_id}/risks").json()
        vx_titles = [r["title"] for r in r_vx]
        print(f"  * Vertex Systems Risks: {vx_titles}")
        assert any("escalat" in t.lower() for t in vx_titles), "Vertex missing escalator risk"
        assert any("liability" in t.lower() for t in vx_titles), "Vertex missing liability limitation risk"
        assert any("time & materials" in t.lower() for t in vx_titles), "Vertex missing T&M risk"

        # Verify evidence attachments on risks
        for r in r_vx:
            assert r.get("evidence") is not None, f"Risk '{r['title']}' missing evidence object"
            assert r["evidence"]["page_number"] in [1, 2, 3]
            assert len(r["evidence"]["quote"]) > 0
            assert r["evidence"]["verified"] is True

        print("[PASS] Vendor Red-Team: Risks successfully discovered across categories with verified evidence.")
        results["red_team_tests"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Red-team test: {e}")
        results["red_team_tests"] = "FAIL"

    # -------------------------------------------------------------
    # 3. FEATURE 2: REQUIREMENT & COMPLIANCE MATRIX TESTS
    # -------------------------------------------------------------
    print("\n--- [TEST 3] FEATURE 2: REQUIREMENT & COMPLIANCE MATRIX ---")
    try:
        # A. Fetch Compliance Matrix
        r_comp = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/compliance")
        assert r_comp.status_code == 200
        comp_data = r_comp.json()
        reqs = comp_data["requirements"]
        matches = comp_data["matches"]

        print(f"  * Total Configured Requirements: {len(reqs)}")
        assert len(reqs) >= 5, "Expected standard requirements configured"

        # Check SOC 2 Type II match for Nexus Cloud
        v_nexus_id = v_map["Nexus Cloud"]
        soc2_req = next(r for r in reqs if "soc 2" in r["title"].lower())
        nexus_soc2_match = next(m for m in matches if m["vendor_id"] == v_nexus_id and m["requirement_id"] == soc2_req["id"])
        
        print(f"  * Nexus Cloud SOC 2 Status: {nexus_soc2_match['status']} (Failure: {nexus_soc2_match.get('failure_reason')})")
        assert nexus_soc2_match["status"] in ["FAIL", "NOT_MET"], "Nexus Cloud must FAIL SOC 2 Type II"
        assert nexus_soc2_match.get("evidence") is not None
        assert "soc 2" in nexus_soc2_match["evidence"]["quote"].lower()

        # B. Add Requirement Endpoint
        new_req_payload = {
            "category": "Compliance",
            "title": "FedRAMP Moderate Authorized",
            "name": "FedRAMP Moderate Authorized",
            "description": "Vendor must hold active FedRAMP Moderate agency ATO.",
            "priority": "SHOULD_HAVE",
            "is_mandatory": False,
            "weight": 10,
            "evaluation_type": "BOOLEAN"
        }
        r_add = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/requirements", json=new_req_payload)
        assert r_add.status_code == 200, f"Add requirement failed: {r_add.text}"
        added_req = r_add.json()
        req_id = added_req["id"]
        print(f"  * Added Requirement: '{added_req['title']}' ({req_id})")

        # C. Update Requirement Endpoint
        r_update = requests.put(f"{BASE_URL}/api/requirements/{req_id}", json={"weight": 18, "priority": "MUST_HAVE", "is_mandatory": True})
        assert r_update.status_code == 200
        updated_req = r_update.json()
        assert updated_req["weight"] == 18
        assert updated_req["priority"] == "MUST_HAVE"
        assert updated_req["is_mandatory"] is True
        print(f"  * Updated Requirement '{req_id}' weight to 18, priority to MUST_HAVE.")

        # D. Delete Requirement Endpoint
        r_del = requests.delete(f"{BASE_URL}/api/requirements/{req_id}")
        assert r_del.status_code == 200
        print(f"  * Deleted Requirement '{req_id}'.")

        print("[PASS] Requirement & Compliance Matrix: Matrix generation, evidence anchors, and CRUD operations verified.")
        results["compliance_matrix_tests"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Compliance matrix test: {e}")
        results["compliance_matrix_tests"] = "FAIL"

    # -------------------------------------------------------------
    # 4. FEATURE 3: NEGOTIATION INTELLIGENCE TESTS
    # -------------------------------------------------------------
    print("\n--- [TEST 4] FEATURE 3: NEGOTIATION INTELLIGENCE ---")
    try:
        v_vertex_id = v_map["Vertex Systems"]
        r_neg = requests.get(f"{BASE_URL}/api/vendors/{v_vertex_id}/negotiation")
        assert r_neg.status_code == 200
        neg_data = r_neg.json()
        items = neg_data["negotiation_items"]

        print(f"  * Vertex Negotiation Items: {len(items)}")
        assert len(items) >= 2, "Expected negotiation items for Vertex Systems"

        esc_item = next(i for i in items if "escalat" in i["issue"].lower())
        print(f"    - Issue: {esc_item['issue']}")
        print(f"    - Current Position: {esc_item['current_position']}")
        print(f"    - Target Position: {esc_item['target_position']}")
        print(f"    - Fallback Position: {esc_item['fallback_position']}")
        assert "7%" in esc_item["current_position"]
        assert "0%" in esc_item["target_position"] or "3%" in esc_item["fallback_position"]
        assert esc_item.get("evidence") is not None

        # Test Negotiation Brief Generator
        r_brief = requests.post(f"{BASE_URL}/api/vendors/{v_vertex_id}/negotiation/brief")
        assert r_brief.status_code == 200
        brief = r_brief.json()
        print(f"  * Generated Negotiation Brief for {brief['vendor_name']}:")
        print(f"    - Executive Position: {brief['executive_position']}")
        print(f"    - Expected Impact: {brief['expected_financial_impact']}")
        print(f"    - Tactical Questions: {len(brief['recommended_questions'])}")
        assert len(brief["top_priorities"]) >= 2
        assert len(brief["recommended_questions"]) >= 3

        print("[PASS] Negotiation Intelligence: Clause playbooks and strategic brief generator verified.")
        results["negotiation_tests"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Negotiation test: {e}")
        results["negotiation_tests"] = "FAIL"

    # -------------------------------------------------------------
    # 5. DETERMINISTIC INTEGRITY & DISQUALIFICATION TESTS
    # -------------------------------------------------------------
    print("\n--- [TEST 5] DETERMINISTIC INTEGRITY & DISQUALIFICATION ---")
    try:
        # Re-fetch detail
        detail = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
        scores = detail["score_results"]
        nexus = next(s for s in scores if s["vendor_name"] == "Nexus Cloud")
        assert bool(nexus["is_disqualified"]) is True
        assert nexus["rank"] == 3

        rec = detail["recommendation"]
        assert rec is not None
        assert "Nexus Cloud" not in rec["top_vendor_name"]
        print(f"[PASS] Disqualified vendor Nexus Cloud is strictly barred from winner recommendation (Rank #{nexus['rank']}).")
        results["deterministic_integrity"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Deterministic integrity test: {e}")
        results["deterministic_integrity"] = "FAIL"

    # -------------------------------------------------------------
    # 6. REWEIGHTING & TIMING TESTS
    # -------------------------------------------------------------
    print("\n--- [TEST 6] REWEIGHTING & TIMING MEASUREMENT ---")
    try:
        t0 = time.perf_counter()
        r_reb = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/weights/rebalance", json={
            "weight_tco": 50.0,
            "weight_technical": 20.0,
            "weight_compliance": 15.0,
            "weight_risk": 10.0,
            "weight_sla": 5.0
        })
        api_dur_ms = round((time.perf_counter() - t0) * 1000, 2)
        assert r_reb.status_code == 200
        reb_json = r_reb.json()
        calc_ms = reb_json.get("calc_time_ms", 0.0)

        print(f"  * Pure Deterministic Calc Time: {calc_ms} ms (<5ms verified)")
        print(f"  * API Roundtrip: {api_dur_ms} ms")
        assert calc_ms < 5.0
        print("[PASS] Reweighting test passed with pure deterministic execution.")
        results["reweighting_tests"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Reweighting test: {e}")
        results["reweighting_tests"] = "FAIL"

    print("\n" + "=" * 70)
    print("PHASE 1 ENHANCEMENTS TEST SUMMARY:")
    all_passed = True
    for k, v in results.items():
        print(f"  {k.ljust(30)}: {v}")
        if v != "PASS":
            all_passed = False
    print("=" * 70)
    return results

if __name__ == "__main__":
    test_phase1()
