import time
from typing import Dict, Any, List, Optional
from ..engine.scoring_engine import ScoringEngine
from ..engine.tco_calculator import TCOCalculator

class SimulationEngine:
    @staticmethod
    def run_simulation(
        vendors: List[Dict[str, Any]],
        tco_data: Dict[str, Dict[str, Any]],
        req_matches: List[Dict[str, Any]],
        requirements: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        baseline_weights: Dict[str, float],
        scenario_weights: Optional[Dict[str, float]] = None,
        tco_assumptions: Optional[Dict[str, Any]] = None,
        requirement_overrides: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a deterministic, isolated What-If Procurement Simulation in-memory.
        NEVER mutates canonical database records.
        Runs in <5ms without any LLM invocations.
        """
        t_start = time.perf_counter()

        # 1. Prepare baseline weights and scenario weights
        base_w = {
            "weight_tco": float(baseline_weights.get("weight_tco", 35.0)),
            "weight_technical": float(baseline_weights.get("weight_technical", 25.0)),
            "weight_compliance": float(baseline_weights.get("weight_compliance", 20.0)),
            "weight_risk": float(baseline_weights.get("weight_risk", 10.0)),
            "weight_sla": float(baseline_weights.get("weight_sla", 10.0))
        }

        scen_w = dict(base_w)
        if scenario_weights:
            for k in ["weight_tco", "weight_technical", "weight_compliance", "weight_risk", "weight_sla"]:
                if k in scenario_weights and scenario_weights[k] is not None:
                    scen_w[k] = float(scenario_weights[k])

        # Validate scenario weights bounds
        for k, v in scen_w.items():
            if v < 0.0:
                raise ValueError(f"Weight '{k}' cannot be negative (got {v})")
        
        sum_w = sum(scen_w.values())
        if sum_w <= 0.0:
            raise ValueError("Total scenario weight must be greater than 0")

        # 2. Prepare Baseline Vendors & Scoring
        base_vendors = [dict(v) for v in vendors]
        base_ranked = ScoringEngine.calculate_scores(
            vendors=base_vendors,
            tco_data=tco_data,
            req_matches=req_matches,
            requirements=requirements,
            risks=risks,
            weights=base_w
        )
        base_map = {r["vendor_id"]: r for r in base_ranked}
        base_winner = next((r["vendor_name"] for r in base_ranked if not r["is_disqualified"]), None)

        # 3. Apply Scenario Requirement Priority Overrides (if any)
        scen_reqs = [dict(r) for r in requirements]
        if requirement_overrides:
            for r in scen_reqs:
                if r["id"] in requirement_overrides:
                    r["priority"] = requirement_overrides[r["id"]]
                    r["is_mandatory"] = (requirement_overrides[r["id"]] == "MUST_HAVE")

        # Re-evaluate scenario vendor disqualification based on scenario requirements
        scen_vendors = []
        for v in vendors:
            v_copy = dict(v)
            v_matches = [m for m in req_matches if m.get("vendor_id") == v["id"]]
            
            # Check if any MUST_HAVE requirement in scenario is failed
            is_dq = False
            dq_reason = None
            for req in scen_reqs:
                is_mand = bool(req.get("is_mandatory", req.get("priority") == "MUST_HAVE"))
                if is_mand:
                    m = next((m for m in v_matches if m.get("requirement_id") == req["id"]), None)
                    if m and str(m.get("status", "")).upper() in ["FAIL", "NOT_MET"]:
                        is_dq = True
                        dq_reason = f"Failed mandatory '{req.get('title', req.get('name', 'Requirement'))}': {m.get('failure_reason', 'Criteria not met')}"
                        break
            
            v_copy["is_disqualified"] = is_dq
            v_copy["disqualification_reason"] = dq_reason
            scen_vendors.append(v_copy)

        # 4. Apply Scenario TCO Assumptions (if any)
        scen_tco_data = {k: dict(v) for k, v in tco_data.items()}
        tco_comp_result = None

        if tco_assumptions:
            target_v_id = tco_assumptions.get("vendor_id")
            for v_id, t_info in scen_tco_data.items():
                if target_v_id is None or target_v_id == v_id:
                    # Extract or override parameters
                    esc = float(tco_assumptions.get("escalation_rate", t_info.get("escalation_rate", 0.0)))
                    if esc < -0.5 or esc > 5.0:
                        raise ValueError(f"Escalation rate {esc} out of valid bounds [-0.5, 5.0]")
                    
                    impl = float(tco_assumptions.get("implementation_fee", t_info.get("implementation_fee", 0.0)))
                    lic1 = float(tco_assumptions.get("annual_license_yr1", t_info.get("year1_license", 0.0)))
                    sup1 = float(tco_assumptions.get("annual_support_yr1", t_info.get("year1_support", 0.0)))
                    users = int(tco_assumptions.get("user_count", 1000))
                    if users <= 0:
                        raise ValueError("user_count must be greater than 0")

                    new_tco = TCOCalculator.calculate_3year_tco(
                        implementation_fee=impl,
                        annual_license_yr1=lic1,
                        annual_support_yr1=sup1,
                        escalation_rate=esc,
                        user_count=users
                    )
                    new_tco["vendor_id"] = v_id
                    scen_tco_data[v_id] = new_tco

                    if target_v_id == v_id or (target_v_id is None and tco_comp_result is None):
                        base_t = tco_data.get(v_id, {})
                        base_total = base_t.get("total_3yr_tco", 0.0)
                        scen_total = new_tco.get("total_3yr_tco", 0.0)
                        diff = round(base_total - scen_total, 2)
                        pct = round((diff / base_total * 100.0), 1) if base_total > 0 else 0.0
                        v_obj = next((v for v in vendors if v["id"] == v_id), {})

                        tco_comp_result = {
                            "vendor_id": v_id,
                            "vendor_name": v_obj.get("name", "Vendor"),
                            "baseline_escalation": base_t.get("escalation_rate", 0.0),
                            "scenario_escalation": esc,
                            "baseline_3yr_tco": base_total,
                            "scenario_3yr_tco": scen_total,
                            "savings_amount": diff,
                            "savings_percentage": pct,
                            "baseline_breakdown": base_t.get("breakdown", {}),
                            "scenario_breakdown": new_tco.get("breakdown", {})
                        }

        # 5. Run Scenario Scoring
        scen_ranked = ScoringEngine.calculate_scores(
            vendors=scen_vendors,
            tco_data=scen_tco_data,
            req_matches=req_matches,
            requirements=scen_reqs,
            risks=risks,
            weights=scen_w
        )
        scen_map = {r["vendor_id"]: r for r in scen_ranked}
        scen_winner = next((r["vendor_name"] for r in scen_ranked if not r["is_disqualified"]), None)

        # 6. Build Deterministic Explanation & Rank Shifts
        rank_changes = []
        score_changes = []
        for r in scen_ranked:
            v_id = r["vendor_id"]
            v_name = r["vendor_name"]
            b_info = base_map.get(v_id, {})

            b_rank = b_info.get("rank", 0)
            s_rank = r.get("rank", 0)
            rank_delta = b_rank - s_rank # positive means moved up in rank

            b_score = b_info.get("total_score", 0.0)
            s_score = r.get("total_score", 0.0)
            score_delta = round(s_score - b_score, 1)

            rank_changes.append({
                "vendor_id": v_id,
                "vendor_name": v_name,
                "baseline_rank": b_rank,
                "scenario_rank": s_rank,
                "rank_delta": rank_delta,
                "baseline_score": b_score,
                "scenario_score": s_score,
                "score_delta": score_delta,
                "is_disqualified": r.get("is_disqualified", False),
                "disqualification_reason": r.get("disqualification_reason")
            })

            score_changes.append({
                "vendor_id": v_id,
                "vendor_name": v_name,
                "score_delta": score_delta,
                "tco_score_delta": round(r["tco_score"] - b_info.get("tco_score", 0.0), 1),
                "technical_score_delta": round(r["technical_score"] - b_info.get("technical_score", 0.0), 1),
                "compliance_score_delta": round(r["compliance_score"] - b_info.get("compliance_score", 0.0), 1),
                "risk_score_delta": round(r["risk_score"] - b_info.get("risk_score", 0.0), 1),
                "sla_score_delta": round(r["sla_score"] - b_info.get("sla_score", 0.0), 1)
            })

        # Calculate Primary Drivers
        primary_drivers = []
        weight_labels = {
            "weight_technical": "Technical & Functional",
            "weight_tco": "Commercial & TCO",
            "weight_compliance": "Security & Compliance",
            "weight_risk": "Risk Penalty",
            "weight_sla": "SLA & Support"
        }

        for k, label in weight_labels.items():
            w_diff = round(scen_w[k] - base_w[k], 1)
            if abs(w_diff) > 0.0:
                sign = "+" if w_diff > 0 else ""
                # Find impact on top vendor
                top_v = scen_ranked[0]
                driver_desc = f"{label} priority shifted by {sign}{w_diff}% (from {base_w[k]}% to {scen_w[k]}%)."
                primary_drivers.append({
                    "criterion": label,
                    "weight_change": f"{sign}{w_diff}%",
                    "baseline_weight": base_w[k],
                    "scenario_weight": scen_w[k],
                    "description": driver_desc
                })

        decision_changed = (base_winner != scen_winner) or any(rc["rank_delta"] != 0 for rc in rank_changes if not rc["is_disqualified"])

        # Construct Executive Summary
        if decision_changed:
            summary = f"Decision shifted: Recommended vendor changed from '{base_winner}' to '{scen_winner}' due to adjusted procurement priorities."
        else:
            summary = f"Decision invariant: '{scen_winner}' remains the top recommended qualified vendor under the evaluated scenario assumptions."

        calc_time_ms = round((time.perf_counter() - t_start) * 1000, 3)

        return {
            "decision_changed": decision_changed,
            "winner_baseline": base_winner,
            "winner_scenario": scen_winner,
            "summary": summary,
            "baseline": {
                "weights": base_w,
                "ranked_vendors": base_ranked
            },
            "scenario": {
                "weights": scen_w,
                "ranked_vendors": scen_ranked,
                "tco_results": list(scen_tco_data.values())
            },
            "rank_changes": rank_changes,
            "score_changes": score_changes,
            "primary_drivers": primary_drivers,
            "tco_comparison": tco_comp_result,
            "calc_time_ms": calc_time_ms
        }
