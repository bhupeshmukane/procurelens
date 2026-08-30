from typing import List, Dict, Any

class ScoringEngine:
    @staticmethod
    def calculate_scores(
        vendors: List[Dict[str, Any]],
        tco_data: Dict[str, Dict[str, Any]],
        req_matches: List[Dict[str, Any]],
        requirements: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        weights: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Deterministically computes multidimensional scores (0-100) and weighted ranking.
        Executes purely in Python memory in <5ms without any LLM call.
        """
        w_tco = float(weights.get("weight_tco", 35.0))
        w_tech = float(weights.get("weight_technical", 25.0))
        w_comp = float(weights.get("weight_compliance", 20.0))
        w_risk = float(weights.get("weight_risk", 10.0))
        w_sla = float(weights.get("weight_sla", 10.0))
        total_weight = w_tco + w_tech + w_comp + w_risk + w_sla
        if total_weight <= 0:
            total_weight = 100.0

        # Find TCO min/max for normalization among vendors with complete TCO
        valid_tcos = [tco_data[v["id"]]["total_3yr_tco"] for v in vendors if v["id"] in tco_data and tco_data[v["id"]]["total_3yr_tco"] > 0]
        min_tco = min(valid_tcos) if valid_tcos else 1.0
        max_tco = max(valid_tcos) if valid_tcos else 1.0

        results = []

        for v in vendors:
            v_id = v["id"]
            v_name = v.get("name", "")

            # 1. TCO Score
            tco_info = tco_data.get(v_id, {})
            total_tco = tco_info.get("total_3yr_tco", 0.0)
            if not tco_info.get("is_complete", False) or total_tco <= 0:
                tco_score = 30.0 # Penalty for incomplete/missing TCO
            elif max_tco == min_tco:
                tco_score = 90.0
            else:
                # Lower TCO is better -> higher score
                tco_ratio = (total_tco - min_tco) / (max_tco - min_tco)
                tco_score = max(20.0, min(100.0, 100.0 - (tco_ratio * 70.0)))

            # 2. Technical Score & Compliance Score
            v_matches = [m for m in req_matches if m.get("vendor_id") == v_id]
            match_dict = {m.get("requirement_id"): m for m in v_matches}

            tech_reqs = [r for r in requirements if r.get("category", "").lower() in ["technical", "features", "architecture"]]
            comp_reqs = [r for r in requirements if r.get("category", "").lower() in ["compliance", "security", "legal"]]
            sla_reqs = [r for r in requirements if r.get("category", "").lower() in ["sla", "support"]]

            def calc_category_score(req_list):
                if not req_list:
                    return 85.0 # Neutral default if none specified
                score_pts = 0.0
                max_pts = 0.0
                for req in req_list:
                    weight = req.get("weight", 1)
                    max_pts += weight
                    m = match_dict.get(req["id"])
                    if m:
                        st = str(m.get("status", "")).upper()
                        if st in ["MET", "PASS"]:
                            score_pts += weight * 1.0
                        elif st in ["PARTIAL"]:
                            score_pts += weight * 0.5
                return (score_pts / max_pts * 100.0) if max_pts > 0 else 85.0

            tech_score = calc_category_score(tech_reqs)
            comp_score = calc_category_score(comp_reqs)
            sla_score = calc_category_score(sla_reqs)

            # 3. Risk Score (100 minus penalty points based on risk severity)
            v_risks = [r for r in risks if r.get("vendor_id") == v_id]
            penalty = 0.0
            for r in v_risks:
                sev = str(r.get("severity", "")).upper()
                if sev == "CRITICAL":
                    penalty += 30.0
                elif sev == "HIGH":
                    penalty += 15.0
                elif sev == "MEDIUM":
                    penalty += 7.0
                else:
                    penalty += 3.0
            risk_score = max(10.0, min(100.0, 100.0 - penalty))

            # 4. Total Weighted Score
            total_score = (
                (tco_score * w_tco) +
                (tech_score * w_tech) +
                (comp_score * w_comp) +
                (risk_score * w_risk) +
                (sla_score * w_sla)
            ) / total_weight

            results.append({
                "vendor_id": v_id,
                "vendor_name": v_name,
                "total_score": round(total_score, 1),
                "tco_score": round(tco_score, 1),
                "technical_score": round(tech_score, 1),
                "compliance_score": round(comp_score, 1),
                "risk_score": round(risk_score, 1),
                "sla_score": round(sla_score, 1),
                "is_disqualified": v.get("is_disqualified", False),
                "disqualification_reason": v.get("disqualification_reason")
            })

        # Rank vendors: Qualified vendors ranked by total_score descending, Disqualified at bottom
        qualified = sorted([r for r in results if not r["is_disqualified"]], key=lambda x: x["total_score"], reverse=True)
        disqualified = sorted([r for r in results if r["is_disqualified"]], key=lambda x: x["total_score"], reverse=True)

        ranked = []
        rank_counter = 1
        for r in qualified:
            r["rank"] = rank_counter
            rank_counter += 1
            ranked.append(r)

        for r in disqualified:
            r["rank"] = rank_counter
            rank_counter += 1
            ranked.append(r)

        return ranked
