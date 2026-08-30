from app.routers.pipeline import run_analytical_pipeline
from app.routers.evaluations import get_evaluation_detail
from app.routers.scoring import rebalance_weights
from app.models.schemas import ScoringWeightsUpdate

eval_id = 'eval_676727888f'
pipe_res = run_analytical_pipeline(eval_id)
print("Pipeline Status:", pipe_res["status"])
print("Top Vendor ID:", pipe_res["top_vendor_id"])

detail = get_evaluation_detail(eval_id)
print("\n=== SCORE RESULTS & RANKS ===")
for s in detail["score_results"]:
    print(f"Rank {s['rank']}: {s['vendor_name']} | Total Score: {s['total_score']} | TCO Score: {s['tco_score']} | Disqualified: {s['is_disqualified']} | Reason: {s['disqualification_reason']}")

print("\n=== TCO RESULTS ===")
for t in detail["tco_results"]:
    print(f"{t['vendor_name']}: 3-Yr TCO = ${t['total_3yr_tco']:,.2f} | Impl = ${t['implementation_fee']:,.2f} | Yr1 = ${t['year1_total']:,.2f} | Yr2 = ${t['year2_total']:,.2f} | Yr3 = ${t['year3_total']:,.2f} | Escalation = {t['escalation_rate']*100:.1f}%")

print("\n=== RISKS IDENTIFIED ===")
for r in detail["risks"]:
    ev_status = "VERIFIED" if r.get("evidence", {}).get("verified") else "UNVERIFIED"
    print(f"[{r['severity']}] {r['vendor_name']} - {r['title']} (Evidence: {ev_status}, Quote: '{r.get('evidence', {}).get('quote', '')[:60]}...')")

print("\n=== NEGOTIATION QUESTIONS ===")
for n in detail["negotiation_questions"]:
    print(f"[{n['priority']}] {n['vendor_name']}: {n['question']} (Clause: {n['target_clause']})")

# Test instant rebalance
rebalance_res = rebalance_weights(eval_id, ScoringWeightsUpdate(weight_tco=10, weight_technical=10, weight_compliance=60, weight_risk=10, weight_sla=10))
print("\n=== INSTANT REBALANCE (Pure Deterministic Python, <5ms) ===")
for s in rebalance_res["score_results"]:
    print(f"Rank {s['rank']}: {s['vendor_name']} | New Score: {s['total_score']}")
