import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def run_phase3_demo_hardening_tests():
    print("=" * 75)
    print("PROCURELENS PHASE 3 DEMO HARDENING & REPRODUCIBILITY AUDIT")
    print("=" * 75)

    results = {}

    # =========================================================================
    # 1. DEMO RESET REPRODUCIBILITY TEST (3 CONSECUTIVE RUNS)
    # =========================================================================
    print("\n--- [AUDIT 1] DEMO RESET REPRODUCIBILITY (3 RUNS) ---")
    snapshots = []
    for run_idx in range(1, 4):
        t0 = time.perf_counter()
        r_reset = requests.post(f"{BASE_URL}/api/demo/reset")
        assert r_reset.status_code == 200
        r_seed = requests.post(f"{BASE_URL}/api/demo/seed")
        assert r_seed.status_code == 200
        eval_id = r_seed.json()["evaluation_id"]
        
        detail = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
        duration = round(time.perf_counter() - t0, 3)
        print(f"  * Run {run_idx}: Seeded in {duration}s | Eval ID: '{eval_id}'")

        # Snapshot key metrics
        snapshot = {
            "vendor_names": sorted([v["name"] for v in detail["vendors"]]),
            "tco_values": {t["vendor_name"]: t["total_3yr_tco"] for t in detail["tco_results"]},
            "disqualifications": {s["vendor_name"]: s["is_disqualified"] for s in detail["score_results"]},
            "winner": detail["recommendation"]["top_vendor_name"],
            "risk_count": len(detail["risks"]),
            "req_match_count": len(detail["requirement_matches"])
        }
        snapshots.append(snapshot)

    # Verify identical data across runs
    assert snapshots[0] == snapshots[1] == snapshots[2], "Demo reset produced non-deterministic results across runs!"
    print(f"  * Verified 100% identical data across all 3 reset/seed cycles:")
    print(f"    - Vendors: {snapshots[0]['vendor_names']}")
    print(f"    - 3-Yr TCOs: {snapshots[0]['tco_values']}")
    print(f"    - Disqualifications: {snapshots[0]['disqualifications']}")
    print(f"    - Winner: '{snapshots[0]['winner']}'")
    print(f"    - Risk Count: {snapshots[0]['risk_count']}")
    print(f"[PASS] Demo reset and seed pipeline is 100% reproducible and deterministic.")
    results["demo_reproducibility"] = "PASS"

    # =========================================================================
    # 2. 17-STEP DEMO SCRIPT WALKTHROUGH VALIDATION
    # =========================================================================
    print("\n--- [AUDIT 2] 17-STEP LIVE DEMO FLOW SCRIPT VALIDATION ---")
    active_eval_id = eval_id
    detail = requests.get(f"{BASE_URL}/api/evaluations/{active_eval_id}").json()

    # Step 1 & 2: Reset & Seed already verified above
    print("  [Step 1-2] Clean Reset & Seed: PASS")

    # Step 3: Open Evaluation Detail
    assert detail["id"] == active_eval_id
    print(f"  [Step 3] Open Evaluation: PASS ('{detail['title']}')")

    # Step 4: Show Vendor Comparison
    vendors = detail["vendors"]
    assert len(vendors) == 3
    print("  [Step 4] Show Vendor Comparison: PASS (CloudCore, Vertex Systems, Nexus Cloud)")

    # Step 5: Show Nexus Lowest Price
    nexus_tco = next(t for t in detail["tco_results"] if "nexus" in t["vendor_name"].lower())
    assert nexus_tco["total_3yr_tco"] == 452726.00
    print(f"  [Step 5] Nexus Lowest Nominal Price: PASS (${nexus_tco['total_3yr_tco']:,.2f})")

    # Step 6: Show Nexus DISQUALIFIED
    nexus_score = next(s for s in detail["score_results"] if "nexus" in s["vendor_name"].lower())
    assert nexus_score["is_disqualified"] is True
    assert nexus_score["rank"] == 3
    print(f"  [Step 6] Nexus DISQUALIFIED Gating: PASS (Rank #{nexus_score['rank']}, Reason: {nexus_score['disqualification_reason']})")

    # Step 7: Open SOC 2 Evidence
    nexus_soc2 = next(m for m in detail["requirement_matches"] if "nexus" in m.get("vendor_name", "").lower() and "soc 2" in m.get("requirement_title", "").lower())
    assert nexus_soc2.get("evidence") is not None
    assert nexus_soc2["evidence"]["verified"] is True
    print(f"  [Step 7] SOC 2 Evidence Anchor: PASS (Page {nexus_soc2['evidence']['page_number']}, Quote: '{nexus_soc2['evidence']['quote'][:40]}...')")

    # Step 8: Show Vertex 7% Escalation
    vertex_tco = next(t for t in detail["tco_results"] if "vertex" in t["vendor_name"].lower())
    assert vertex_tco["escalation_rate"] == 0.07
    assert vertex_tco["total_3yr_tco"] == 549384.00
    print(f"  [Step 8] Vertex 7% Escalation: PASS (7.0% annual compound escalator -> $549,384.00 TCO)")

    # Step 9: Open Escalator Evidence
    vertex_esc_risk = next(r for r in detail["risks"] if "vertex" in r.get("vendor_name", "").lower() and "escalat" in r.get("title", "").lower())
    assert vertex_esc_risk.get("evidence") is not None
    assert vertex_esc_risk["evidence"]["verified"] is True
    print(f"  [Step 9] Escalator Evidence Anchor: PASS (Page {vertex_esc_risk['evidence']['page_number']}, Quote: '{vertex_esc_risk['evidence']['quote'][:40]}...')")

    # Step 10: Open Decision Simulator
    r_sim_init = requests.post(f"{BASE_URL}/api/evaluations/{active_eval_id}/simulate", json={}).json()
    assert r_sim_init["winner_baseline"] == "CloudCore"
    print("  [Step 10] Open Decision Simulator: PASS")

    # Step 11 & 12: Select Security-First & Verify Deterministic Update
    sec_first_payload = {
        "scenario_name": "Security-First",
        "weights": {
            "weight_tco": 20.0,
            "weight_technical": 25.0,
            "weight_compliance": 45.0,
            "weight_risk": 5.0,
            "weight_sla": 5.0
        }
    }
    r_sec = requests.post(f"{BASE_URL}/api/evaluations/{active_eval_id}/simulate", json=sec_first_payload).json()
    assert r_sec["winner_scenario"] == "CloudCore"
    print(f"  [Step 11-12] Security-First Simulation: PASS (Winner: '{r_sec['winner_scenario']}', Calc: {r_sec['calc_time_ms']}ms)")

    # Step 13: Open "Why did the decision change?"
    assert len(r_sec["primary_drivers"]) >= 3
    assert any("Security" in d["criterion"] for d in r_sec["primary_drivers"])
    print(f"  [Step 13] Why Panel Contribution Drivers: PASS ({len(r_sec['primary_drivers'])} drivers)")

    # Step 14 & 15: Change Vertex 7% -> 3% & Verify TCO Delta
    vx_id = next(v["id"] for v in detail["vendors"] if "vertex" in v["name"].lower())
    tco_sim_payload = {
        "scenario_name": "Negotiated Vertex",
        "tco_assumptions": {
            "vendor_id": vx_id,
            "escalation_rate": 0.03
        }
    }
    r_tco_delta = requests.post(f"{BASE_URL}/api/evaluations/{active_eval_id}/simulate", json=tco_sim_payload).json()
    tco_comp = r_tco_delta["tco_comparison"]
    assert tco_comp["savings_amount"] == 19840.00
    print(f"  [Step 14-15] Vertex 7% -> 3% TCO Savings: PASS (${tco_comp['savings_amount']:,.2f} / -{tco_comp['savings_percentage']}%)")

    # Step 16: Open Negotiation Intelligence
    r_neg = requests.get(f"{BASE_URL}/api/vendors/{vx_id}/negotiation").json()
    assert len(r_neg["negotiation_items"]) >= 4
    print(f"  [Step 16] Open Negotiation Guide: PASS ({len(r_neg['negotiation_items'])} tactical clauses)")

    # Step 17: Generate Negotiation Brief
    r_brief = requests.post(f"{BASE_URL}/api/vendors/{vx_id}/negotiation/brief").json()
    assert len(r_brief["executive_position"]) > 0
    assert len(r_brief["recommended_questions"]) == 3
    print(f"  [Step 17] Generate Negotiation Brief: PASS (Impact: '{r_brief['expected_financial_impact']}')")

    print("[PASS] Complete 17-step demo script executed end-to-end with 0 failures.")
    results["demo_script_walkthrough"] = "PASS"

    # =========================================================================
    # 3. LATENCY BENCHMARKS (ACTUAL MEASURED VALUES)
    # =========================================================================
    print("\n--- [AUDIT 3] PERFORMANCE BENCHMARK ---")
    sim_calc_times = []
    api_roundtrips = []
    for _ in range(10):
        t_start = time.perf_counter()
        res = requests.post(f"{BASE_URL}/api/evaluations/{active_eval_id}/simulate", json={
            "weights": {"weight_tco": 30, "weight_technical": 30, "weight_compliance": 20, "weight_risk": 10, "weight_sla": 10}
        }).json()
        api_roundtrips.append((time.perf_counter() - t_start) * 1000)
        sim_calc_times.append(res["calc_time_ms"])

    avg_calc = round(sum(sim_calc_times) / len(sim_calc_times), 3)
    avg_api = round(sum(api_roundtrips) / len(api_roundtrips), 2)
    print(f"  * Average Isolated Simulation Calculation Latency: {avg_calc} ms (< 5ms verified)")
    print(f"  * Average End-to-End API Roundtrip Latency: {avg_api} ms")
    assert avg_calc < 5.0

    print("\n" + "=" * 75)
    print("PHASE 3 DEMO HARDENING SUMMARY:")
    for k, v in results.items():
        print(f"  {k.ljust(35)}: {v}")
    print("=" * 75)
    return results, avg_calc, avg_api

if __name__ == "__main__":
    run_phase3_demo_hardening_tests()
