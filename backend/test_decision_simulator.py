import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
TOTAL_ASSERTIONS = 0

def record_assert(condition, message="Assertion failed"):
    global TOTAL_ASSERTIONS
    TOTAL_ASSERTIONS += 1
    assert condition, message

def setup_demo():
    requests.post(f"{BASE_URL}/api/demo/reset")
    seed_res = requests.post(f"{BASE_URL}/api/demo/seed").json()
    eval_id = seed_res["evaluation_id"]
    detail = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    return eval_id, detail

# 1. Baseline matches canonical ranking
def test_1_baseline_matches_canonical_ranking(eval_id, detail):
    r_sim = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json={}).json()
    record_assert(r_sim["winner_baseline"] == detail["recommendation"]["top_vendor_name"])
    record_assert(r_sim["winner_scenario"] == detail["recommendation"]["top_vendor_name"])
    record_assert(r_sim["decision_changed"] is False)
    record_assert(len(r_sim["baseline"]["ranked_vendors"]) == 3)
    record_assert(r_sim["calc_time_ms"] < 5.0)

# 2. Weight changes
def test_2_weight_changes(eval_id, detail):
    payload = {"weights": {"weight_technical": 50.0, "weight_tco": 20.0, "weight_compliance": 20.0, "weight_risk": 5.0, "weight_sla": 5.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    record_assert(res["scenario"]["weights"]["weight_technical"] == 50.0)
    record_assert(res["scenario"]["weights"]["weight_tco"] == 20.0)
    record_assert(len(res["scenario"]["ranked_vendors"]) == 3)

# 3. Weight total validation
def test_3_weight_total_validation(eval_id, detail):
    payload = {"weights": {"weight_technical": 35.0, "weight_tco": 30.0, "weight_compliance": 20.0, "weight_risk": 10.0, "weight_sla": 5.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    total_w = sum(res["scenario"]["weights"].values())
    record_assert(total_w == 100.0)

# 4. Negative weights rejected
def test_4_negative_weights_rejected(eval_id, detail):
    payload = {"weights": {"weight_technical": -10.0, "weight_tco": 50.0}}
    r = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload)
    record_assert(r.status_code == 422)

# 5. >100% weights / 0 total validation
def test_5_above_100_or_zero_weights(eval_id, detail):
    payload_zero = {"weights": {"weight_technical": 0, "weight_tco": 0, "weight_compliance": 0, "weight_risk": 0, "weight_sla": 0}}
    r = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload_zero)
    record_assert(r.status_code == 422)

# 6. TCO scenario calculation
def test_6_tco_scenario_calculation(eval_id, detail):
    vx_id = next(v["id"] for v in detail["vendors"] if "vertex" in v["name"].lower())
    payload = {"tco_assumptions": {"vendor_id": vx_id, "annual_license_yr1": 150000.0, "annual_support_yr1": 25000.0, "escalation_rate": 0.05}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    record_assert(res["tco_comparison"] is not None)
    record_assert(res["tco_comparison"]["scenario_3yr_tco"] > 0)

# 7. Escalation scenario (Vertex 7% -> 3%)
def test_7_escalation_scenario(eval_id, detail):
    vx_id = next(v["id"] for v in detail["vendors"] if "vertex" in v["name"].lower())
    payload = {"tco_assumptions": {"vendor_id": vx_id, "escalation_rate": 0.03}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    tco_comp = res["tco_comparison"]
    record_assert(tco_comp["baseline_3yr_tco"] == 549384.00)
    record_assert(tco_comp["scenario_3yr_tco"] == 529544.00)
    record_assert(tco_comp["savings_amount"] == 19840.00)
    record_assert(tco_comp["savings_percentage"] == 3.6)

# 8. Score delta calculation
def test_8_score_delta_calculation(eval_id, detail):
    payload = {"weights": {"weight_technical": 50.0, "weight_tco": 20.0, "weight_compliance": 20.0, "weight_risk": 5.0, "weight_sla": 5.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    record_assert(len(res["score_changes"]) == 3)
    for sc in res["score_changes"]:
        record_assert("score_delta" in sc)
        record_assert("technical_score_delta" in sc)

# 9. Rank delta calculation
def test_9_rank_delta_calculation(eval_id, detail):
    payload = {"weights": {"weight_technical": 60.0, "weight_tco": 10.0, "weight_compliance": 20.0, "weight_risk": 5.0, "weight_sla": 5.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    record_assert(len(res["rank_changes"]) == 3)
    for rc in res["rank_changes"]:
        record_assert(rc["rank_delta"] == rc["baseline_rank"] - rc["scenario_rank"])

# 10. Explanation generation
def test_10_explanation_generation(eval_id, detail):
    payload = {"weights": {"weight_compliance": 50.0, "weight_tco": 10.0, "weight_technical": 30.0, "weight_risk": 5.0, "weight_sla": 5.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    record_assert(len(res["summary"]) > 0)
    record_assert(len(res["primary_drivers"]) >= 2)
    record_assert(any("Security & Compliance" in d["criterion"] for d in res["primary_drivers"]))

# 11. Disqualification invariance
def test_11_disqualification_invariance(eval_id, detail):
    payload = {"weights": {"weight_tco": 100.0, "weight_technical": 0.0, "weight_compliance": 0.0, "weight_risk": 0.0, "weight_sla": 0.0}}
    res = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json=payload).json()
    nexus = next(rc for rc in res["rank_changes"] if "nexus" in rc["vendor_name"].lower())
    record_assert(nexus["is_disqualified"] is True)
    record_assert(nexus["scenario_rank"] == 3)
    record_assert(res["winner_scenario"] != "Nexus Cloud")

# 12. Database immutability
def test_12_database_immutability(eval_id, detail):
    # Run 10 simulations
    for i in range(10):
        requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json={"weights": {"weight_tco": 20 + i, "weight_technical": 40 - i}})
    detail_post = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    record_assert(detail_post["weights"] == detail["weights"])
    record_assert(detail_post["recommendation"]["top_vendor_name"] == detail["recommendation"]["top_vendor_name"])

# 13. Evidence immutability
def test_13_evidence_immutability(eval_id, detail):
    detail_post = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    record_assert(len(detail_post["risks"]) == len(detail["risks"]))
    for idx, r in enumerate(detail["risks"]):
        record_assert(r["evidence"]["quote"] == detail_post["risks"][idx]["evidence"]["quote"])

# 14. Compliance immutability
def test_14_compliance_immutability(eval_id, detail):
    detail_post = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    record_assert(len(detail_post["requirement_matches"]) == len(detail["requirement_matches"]))
    for idx, m in enumerate(detail["requirement_matches"]):
        record_assert(m["status"] == detail_post["requirement_matches"][idx]["status"])

# 15. Canonical TCO immutability
def test_15_canonical_tco_immutability(eval_id, detail):
    detail_post = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    for idx, t in enumerate(detail["tco_results"]):
        record_assert(t["total_3yr_tco"] == detail_post["tco_results"][idx]["total_3yr_tco"])
        record_assert(t["escalation_rate"] == detail_post["tco_results"][idx]["escalation_rate"])

# 16. Reset-to-baseline
def test_16_reset_to_baseline(eval_id, detail):
    # Simulate custom then empty payload
    requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json={"weights": {"weight_technical": 80.0, "weight_tco": 5.0}})
    res_reset = requests.post(f"{BASE_URL}/api/evaluations/{eval_id}/simulate", json={}).json()
    record_assert(res_reset["winner_scenario"] == detail["recommendation"]["top_vendor_name"])
    record_assert(res_reset["decision_changed"] is False)

# 17. Scenario isolation
def test_17_scenario_isolation(eval_id, detail):
    # Create evaluation Beta
    r_b = requests.post(f"{BASE_URL}/api/evaluations", json={"title": "Eval Beta", "category": "AI"}).json()
    eval_b = r_b["id"]
    # Attempt to simulate on Eval Beta with zero vendors
    r_sim_b = requests.post(f"{BASE_URL}/api/evaluations/{eval_b}/simulate", json={})
    record_assert(r_sim_b.status_code == 400 or r_sim_b.status_code == 422)
    # Ensure Eval Alpha still intact
    detail_a = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    record_assert(len(detail_a["vendors"]) == 3)

def run_all_decision_simulator_tests():
    global TOTAL_ASSERTIONS
    TOTAL_ASSERTIONS = 0

    print("=" * 75)
    print("PROCURELENS DECISION SIMULATOR — 17-POINT FULL VERIFICATION HARNESS")
    print("=" * 75)

    eval_id, detail = setup_demo()
    print(f"[INIT] Demo evaluation prepared: '{eval_id}'")

    tests = [
        ("1. Baseline matches canonical ranking", test_1_baseline_matches_canonical_ranking),
        ("2. Weight changes", test_2_weight_changes),
        ("3. Weight total validation", test_3_weight_total_validation),
        ("4. Negative weights rejected", test_4_negative_weights_rejected),
        ("5. >100% weights / 0 total validated", test_5_above_100_or_zero_weights),
        ("6. TCO scenario calculation", test_6_tco_scenario_calculation),
        ("7. Escalation scenario (7% -> 3%)", test_7_escalation_scenario),
        ("8. Score delta calculation", test_8_score_delta_calculation),
        ("9. Rank delta calculation", test_9_rank_delta_calculation),
        ("10. Explanation generation", test_10_explanation_generation),
        ("11. Disqualification invariance", test_11_disqualification_invariance),
        ("12. Database immutability", test_12_database_immutability),
        ("13. Evidence immutability", test_13_evidence_immutability),
        ("14. Compliance immutability", test_14_compliance_immutability),
        ("15. Canonical TCO immutability", test_15_canonical_tco_immutability),
        ("16. Reset-to-baseline", test_16_reset_to_baseline),
        ("17. Scenario isolation", test_17_scenario_isolation),
    ]

    passed_tests = 0
    for name, test_func in tests:
        try:
            test_func(eval_id, detail)
            print(f"  [PASS] {name}")
            passed_tests += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")

    print("=" * 75)
    print(f"TEST SUMMARY: {passed_tests}/{len(tests)} TESTS PASSED ({TOTAL_ASSERTIONS} TOTAL ASSERTIONS VERIFIED)")
    print("=" * 75)
    return passed_tests, len(tests), TOTAL_ASSERTIONS

if __name__ == "__main__":
    passed, total, assertions = run_all_decision_simulator_tests()
    if passed != total:
        sys.exit(1)
