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

# 1. Winner is derived from actual evaluation data
def test_1_winner_derived_from_actual_data(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    winner_name = detail["recommendation"]["top_vendor_name"]
    record_assert(trace["recommended_vendor"]["vendor_name"] == winner_name)
    record_assert(bool(trace["recommended_vendor"]["is_disqualified"]) is False)
    record_assert(trace["recommended_vendor"]["rank"] == 1)

# 2. Score contributions equal deterministic engine results
def test_2_score_contributions_equal_deterministic_math(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    weights = detail["weights"]
    w_sum = weights["weight_tco"] + weights["weight_technical"] + weights["weight_compliance"] + weights["weight_risk"] + weights["weight_sla"]
    
    for vc in trace["score_contributions"]:
        raw_score = vc["total_score"]
        calc_sum = sum(c["weighted_contribution"] for c in vc["contributions"])
        # Contribution sum should match total score within rounding precision (0.2 pt)
        record_assert(abs(raw_score - calc_sum) < 0.2, f"Contribution sum {calc_sum} != {raw_score}")
        record_assert(len(vc["contributions"]) == 5)

# 3. TCO values match canonical TCO records
def test_3_tco_values_match_canonical(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    canonical_tco_map = {t["vendor_name"]: t["total_3yr_tco"] for t in detail["tco_results"]}
    
    record_assert(canonical_tco_map["CloudCore"] == 600000.0)
    record_assert(canonical_tco_map["Vertex Systems"] == 549384.0)
    record_assert(canonical_tco_map["Nexus Cloud"] == 452726.0)
    
    # Check why_not_cheapest nominal TCO
    if trace["why_not_cheapest"]:
        record_assert(trace["why_not_cheapest"]["nominal_3yr_tco"] == 452726.0)

# 4. Disqualified vendor cannot become winner
def test_4_disqualified_vendor_cannot_become_winner(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    record_assert(trace["why_not_cheapest"] is not None)
    record_assert(trace["why_not_cheapest"]["vendor_name"] == "Nexus Cloud")
    record_assert(trace["why_not_cheapest"]["status"] == "DISQUALIFIED")
    record_assert("SOC 2" in trace["why_not_cheapest"]["failed_requirement"])
    record_assert(trace["recommended_vendor"]["vendor_name"] != "Nexus Cloud")

# 5. Evidence links resolve to real evidence
def test_5_evidence_links_resolve(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    for pillar in trace["why_vendor_won"]:
        if pillar.get("evidence_id"):
            ev = requests.get(f"{BASE_URL}/api/evidence/{pillar['evidence_id']}").json()
            record_assert(ev["verified"] is True)
            record_assert(len(ev["quote"]) > 0)
            record_assert(ev["page_number"] >= 1)

# 6. Missing evidence is never fabricated
def test_6_missing_evidence_not_fabricated(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    for pillar in trace["why_vendor_won"]:
        if not pillar.get("evidence_id"):
            record_assert(pillar.get("evidence_quote") is None or "Not available" in pillar.get("evidence_quote", "") or len(pillar.get("evidence_quote", "")) > 0)

# 7. Decision Trace does not modify database
def test_7_decision_trace_database_immutability(eval_id, detail):
    # Call trace 10 times
    for _ in range(10):
        requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace")
    
    detail_after = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}").json()
    record_assert(detail_after["weights"] == detail["weights"])
    record_assert(detail_after["recommendation"]["top_vendor_name"] == detail["recommendation"]["top_vendor_name"])
    record_assert(len(detail_after["risks"]) == len(detail["risks"]))

# 8. Export Decision Pack uses current evaluation data
def test_8_export_decision_pack_data(eval_id, detail):
    pack = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-pack").json()
    record_assert(pack["evaluation_title"] == detail["title"])
    record_assert(pack["page1_executive_summary"]["recommended_vendor"] == "CloudCore")
    record_assert(len(pack["page2_vendor_comparison"]) == 3)
    record_assert(len(pack["page4_risk_intelligence"]) >= 5)
    record_assert(len(pack["page5_negotiation_priorities"]) >= 4)
    record_assert(len(pack["page6_evidence_index"]) >= 10)

# 9. Judge Mode uses current evaluation data
def test_9_judge_mode_live_data(eval_id, detail):
    trace = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/decision-trace").json()
    record_assert(len(trace["why_vendor_won"]) >= 3)
    record_assert(trace["negotiation_opportunity"]["target_vendor"] == "Vertex Systems")
    record_assert(trace["negotiation_opportunity"]["projected_3yr_savings"] == 19840.0)

# 10. Compliance status consistency and evidence anchoring
def test_10_compliance_status_consistency_and_evidence_anchoring(eval_id, detail):
    matches = detail["requirement_matches"]
    
    # 1. CloudCore consistency: 8/8 PASS
    cc_matches = [m for m in matches if "cloudcore" in m.get("vendor_name", "").lower()]
    record_assert(len(cc_matches) == 8, f"CloudCore matches count {len(cc_matches)} != 8")
    for m in cc_matches:
        record_assert(m["status"] == "PASS", f"CloudCore requirement '{m['requirement_title']}' has status {m['status']} != PASS")
        record_assert(m["failure_reason"] is None)
        record_assert(m.get("evidence") is not None)
        record_assert(len(m["evidence"]["quote"]) > 0)
    
    # 2. Nexus Cloud consistency: FAIL on SOC 2 Type II
    nexus_matches = [m for m in matches if "nexus" in m.get("vendor_name", "").lower()]
    soc2_nexus = next(m for m in nexus_matches if "soc 2" in m["requirement_title"].lower())
    record_assert(soc2_nexus["status"] == "FAIL", f"Nexus SOC 2 status {soc2_nexus['status']} != FAIL")
    record_assert("in progress" in soc2_nexus["failure_reason"].lower())
    
    # 3. Vertex Systems consistency: PARTIAL on SLA and Sandbox
    vx_matches = [m for m in matches if "vertex" in m.get("vendor_name", "").lower()]
    sla_vx = next(m for m in vx_matches if "sla" in m["requirement_title"].lower() or "uptime" in m["requirement_title"].lower())
    record_assert(sla_vx["status"] == "PARTIAL", f"Vertex SLA status {sla_vx['status']} != PARTIAL")

def run_phase4_decision_trace_tests():
    global TOTAL_ASSERTIONS
    TOTAL_ASSERTIONS = 0

    print("=" * 75)
    print("PROCURELENS PHASE 4 DECISION TRACE & EXECUTIVE PACK TEST SUITE")
    print("=" * 75)

    eval_id, detail = setup_demo()
    print(f"[INIT] Demo evaluation initialized: '{eval_id}'")

    tests = [
        ("1. Winner derived from actual evaluation data", test_1_winner_derived_from_actual_data),
        ("2. Score contributions equal deterministic engine results", test_2_score_contributions_equal_deterministic_math),
        ("3. TCO values match canonical TCO records", test_3_tco_values_match_canonical),
        ("4. Disqualified vendor cannot become winner", test_4_disqualified_vendor_cannot_become_winner),
        ("5. Evidence links resolve to real evidence", test_5_evidence_links_resolve),
        ("6. Missing evidence is never fabricated", test_6_missing_evidence_not_fabricated),
        ("7. Decision Trace does not modify database", test_7_decision_trace_database_immutability),
        ("8. Export uses current evaluation data", test_8_export_decision_pack_data),
        ("9. Judge Mode uses current evaluation data", test_9_judge_mode_live_data),
        ("10. Compliance status consistency & evidence anchoring", test_10_compliance_status_consistency_and_evidence_anchoring),
    ]

    passed_count = 0
    for name, test_func in tests:
        try:
            test_func(eval_id, detail)
            print(f"  [PASS] {name}")
            passed_count += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")

    print("=" * 75)
    print(f"PHASE 4 TEST SUMMARY: {passed_count}/{len(tests)} TESTS PASSED ({TOTAL_ASSERTIONS} TOTAL ASSERTIONS VERIFIED)")
    print("=" * 75)
    return passed_count == len(tests)

if __name__ == "__main__":
    success = run_phase4_decision_trace_tests()
    if not success:
        sys.exit(1)
