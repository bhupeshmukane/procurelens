import time
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..models.schemas import ScoringWeightsUpdate
from ..engine.scoring_engine import ScoringEngine

router = APIRouter(prefix="/api/evaluations", tags=["scoring"])

@router.post("/{eval_id}/weights/rebalance")
def rebalance_weights(eval_id: str, weights_in: ScoringWeightsUpdate):
    """
    CRITICAL ARCHITECTURAL RULE:
    Instant deterministic re-weighting and ranking recalculation.
    Never calls any LLM. Measures pure deterministic calculation time separately.
    """
    api_start = time.perf_counter()

    with get_db() as conn:
        cursor = conn.cursor()

        # Check evaluation
        cursor.execute("SELECT * FROM evaluations WHERE id = ?", (eval_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # Update scoring weights in database
        cursor.execute("""
            UPDATE scoring_weights 
            SET weight_tco = ?, weight_technical = ?, weight_compliance = ?, weight_risk = ?, weight_sla = ?
            WHERE evaluation_id = ?
        """, (weights_in.weight_tco, weights_in.weight_technical, weights_in.weight_compliance, weights_in.weight_risk, weights_in.weight_sla, eval_id))

        # Fetch vendors
        cursor.execute("SELECT * FROM vendors WHERE evaluation_id = ?", (eval_id,))
        vendors = [dict(v) for v in cursor.fetchall()]
        if not vendors:
            return {
                "message": "No vendors to score",
                "score_results": [],
                "calc_time_ms": 0.0,
                "api_time_ms": round((time.perf_counter() - api_start) * 1000, 2)
            }

        # Fetch requirements
        cursor.execute("SELECT * FROM requirements WHERE evaluation_id = ?", (eval_id,))
        requirements = [dict(r) for r in cursor.fetchall()]

        # Fetch matches
        cursor.execute("SELECT * FROM requirement_matches WHERE evaluation_id = ?", (eval_id,))
        req_matches = [dict(m) for m in cursor.fetchall()]

        # Fetch TCO data
        cursor.execute("SELECT * FROM tco_results WHERE evaluation_id = ?", (eval_id,))
        tco_rows = cursor.fetchall()
        tco_data = {r["vendor_id"]: dict(r) for r in tco_rows}

        # Fetch risks
        cursor.execute("SELECT * FROM risks WHERE evaluation_id = ?", (eval_id,))
        risks = [dict(r) for r in cursor.fetchall()]

        # Re-check disqualification flags from score_results
        cursor.execute("SELECT vendor_id, is_disqualified, disqualification_reason FROM score_results WHERE evaluation_id = ?", (eval_id,))
        disqual_map = {r["vendor_id"]: r for r in cursor.fetchall()}
        for v in vendors:
            dq = disqual_map.get(v["id"])
            v["is_disqualified"] = bool(dq["is_disqualified"]) if dq else False
            v["disqualification_reason"] = dq["disqualification_reason"] if dq else None

        # --- PURE DETERMINISTIC CALCULATION (TIMED ISOLATED) ---
        calc_start = time.perf_counter()
        ranked = ScoringEngine.calculate_scores(
            vendors=vendors,
            tco_data=tco_data,
            req_matches=req_matches,
            requirements=requirements,
            risks=risks,
            weights=weights_in.dict()
        )
        calc_time_ms = round((time.perf_counter() - calc_start) * 1000, 3)
        # -------------------------------------------------------

        # Update score_results table
        for s in ranked:
            cursor.execute("""
                UPDATE score_results
                SET total_score = ?, tco_score = ?, technical_score = ?, compliance_score = ?, risk_score = ?, sla_score = ?, rank = ?
                WHERE evaluation_id = ? AND vendor_id = ?
            """, (s["total_score"], s["tco_score"], s["technical_score"], s["compliance_score"], s["risk_score"], s["sla_score"], s["rank"], eval_id, s["vendor_id"]))

        api_time_ms = round((time.perf_counter() - api_start) * 1000, 2)

        return {
            "evaluation_id": eval_id,
            "weights": weights_in.dict(),
            "score_results": ranked,
            "calc_time_ms": calc_time_ms,
            "api_time_ms": api_time_ms,
            "message": f"Deterministic recalculation in {calc_time_ms}ms (API total: {api_time_ms}ms)"
        }

@router.post("/{eval_id}/simulate")
def run_simulation(eval_id: str, sim_in: Optional[dict] = None):
    """
    PHASE 2 PROCUREMENT DECISION SIMULATOR ENDPOINT:
    Executes What-If scenario simulations (priority weights, TCO assumptions, requirement gating).
    CRITICAL RULE:
    1. Read-only against canonical evaluation data. Zero database mutations.
    2. Runs purely deterministically in <5ms without any LLM calls.
    3. Re-evaluates ranking and generates structured explanation of WHY the decision changed.
    """
    api_start = time.perf_counter()
    from ..engine.simulation_engine import SimulationEngine

    payload = sim_in or {}
    scen_weights = payload.get("weights")
    tco_assumptions = payload.get("tco_assumptions")
    req_overrides = payload.get("requirement_overrides")

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch evaluation
        cursor.execute("SELECT * FROM evaluations WHERE id = ?", (eval_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # 2. Fetch canonical scoring weights
        cursor.execute("SELECT * FROM scoring_weights WHERE evaluation_id = ?", (eval_id,))
        w_row = cursor.fetchone()
        base_weights = dict(w_row) if w_row else {
            "weight_tco": 35.0,
            "weight_technical": 25.0,
            "weight_compliance": 20.0,
            "weight_risk": 10.0,
            "weight_sla": 10.0
        }

        # 3. Fetch vendors
        cursor.execute("SELECT * FROM vendors WHERE evaluation_id = ?", (eval_id,))
        vendors = [dict(v) for v in cursor.fetchall()]
        if not vendors:
            raise HTTPException(status_code=400, detail="No vendors found for this evaluation")

        # 4. Fetch requirements & matches
        cursor.execute("SELECT * FROM requirements WHERE evaluation_id = ?", (eval_id,))
        requirements = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM requirement_matches WHERE evaluation_id = ?", (eval_id,))
        req_matches = [dict(m) for m in cursor.fetchall()]

        # 5. Fetch canonical TCO results
        cursor.execute("SELECT * FROM tco_results WHERE evaluation_id = ?", (eval_id,))
        tco_data = {r["vendor_id"]: dict(r) for r in cursor.fetchall()}

        # 6. Fetch risks
        cursor.execute("SELECT * FROM risks WHERE evaluation_id = ?", (eval_id,))
        risks = [dict(r) for r in cursor.fetchall()]

        # 7. Fetch disqualification flags from baseline score_results
        cursor.execute("SELECT vendor_id, is_disqualified, disqualification_reason FROM score_results WHERE evaluation_id = ?", (eval_id,))
        disqual_map = {r["vendor_id"]: r for r in cursor.fetchall()}
        for v in vendors:
            dq = disqual_map.get(v["id"])
            v["is_disqualified"] = bool(dq["is_disqualified"]) if dq else False
            v["disqualification_reason"] = dq["disqualification_reason"] if dq else None

        # 8. Execute Simulation Engine
        try:
            sim_result = SimulationEngine.run_simulation(
                vendors=vendors,
                tco_data=tco_data,
                req_matches=req_matches,
                requirements=requirements,
                risks=risks,
                baseline_weights=base_weights,
                scenario_weights=scen_weights,
                tco_assumptions=tco_assumptions,
                requirement_overrides=req_overrides
            )
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))

        api_time_ms = round((time.perf_counter() - api_start) * 1000, 2)
        sim_result["evaluation_id"] = eval_id
        sim_result["scenario_name"] = payload.get("scenario_name", "What-If Scenario")
        sim_result["api_time_ms"] = api_time_ms

        return sim_result

