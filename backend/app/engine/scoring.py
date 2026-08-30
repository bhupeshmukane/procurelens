import json
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
    Executes in <5ms purely in Python memory without any LLM call.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Check evaluation
        cursor.execute("SELECT * FROM evaluations WHERE id = ?", (eval_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # Update scoring weights
        cursor.execute("""
            UPDATE scoring_weights 
            SET weight_tco = ?, weight_technical = ?, weight_compliance = ?, weight_risk = ?, weight_sla = ?
            WHERE evaluation_id = ?
        """, (weights_in.weight_tco, weights_in.weight_technical, weights_in.weight_compliance, weights_in.weight_risk, weights_in.weight_sla, eval_id))

        # Fetch vendors
        cursor.execute("SELECT * FROM vendors WHERE evaluation_id = ?", (eval_id,))
        vendors = [dict(v) for v in cursor.fetchall()]
        if not vendors:
            return {"message": "No vendors to score", "scores": []}

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

        # Re-check disqualification flags from score_results or kill gate
        cursor.execute("SELECT vendor_id, is_disqualified, disqualification_reason FROM score_results WHERE evaluation_id = ?", (eval_id,))
        disqual_map = {r["vendor_id"]: r for r in cursor.fetchall()}
        for v in vendors:
            dq = disqual_map.get(v["id"])
            v["is_disqualified"] = bool(dq["is_disqualified"]) if dq else False
            v["disqualification_reason"] = dq["disqualification_reason"] if dq else None

        # Deterministic Scoring recalculation
        ranked = ScoringEngine.calculate_scores(
            vendors=vendors,
            tco_data=tco_data,
            req_matches=req_matches,
            requirements=requirements,
            risks=risks,
            weights=weights_in.dict()
        )

        # Update score_results table
        for s in ranked:
            cursor.execute("""
                UPDATE score_results
                SET total_score = ?, tco_score = ?, technical_score = ?, compliance_score = ?, risk_score = ?, sla_score = ?, rank = ?
                WHERE evaluation_id = ? AND vendor_id = ?
            """, (s["total_score"], s["tco_score"], s["technical_score"], s["compliance_score"], s["risk_score"], s["sla_score"], s["rank"], eval_id, s["vendor_id"]))

        return {
            "evaluation_id": eval_id,
            "weights": weights_in.dict(),
            "score_results": ranked,
            "message": "Weights updated and scores recalculated deterministically."
        }
