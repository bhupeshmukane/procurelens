import uuid
import json
from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..services.pdf_parser import PDFParserService
from ..services.evidence_verifier import EvidenceVerifier
from ..services.llm_service import LLMService
from ..engine.tco_calculator import TCOCalculator
from ..engine.kill_criteria_gate import KillCriteriaGate
from ..engine.scoring_engine import ScoringEngine

router = APIRouter(prefix="/api/evaluations", tags=["pipeline"])

@router.post("/{eval_id}/pipeline/run")
def run_analytical_pipeline(eval_id: str):
    """
    Executes the 6-stage analytical pipeline:
    1. Ingestion & Page Anchoring (SQLite)
    2. Extraction of Facts, Red-Team Risks, Compliance Matches, and Negotiation Items
    3. Exact Evidence Quote Verification against page text
    4. Deterministic 3-Year TCO Calculation (Pure Python, Compounding Escalation)
    5. Mandatory Kill-Criteria Gate Evaluation (Nexus Cloud fails SOC 2 Type II -> Disqualified)
    6. Multi-Criteria Weighted Scoring & Executive Strategy Synthesis
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Check evaluation
        cursor.execute("SELECT * FROM evaluations WHERE id = ?", (eval_id,))
        eval_row = cursor.fetchone()
        if not eval_row:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # Update evaluation status
        cursor.execute("UPDATE evaluations SET status = 'processing', pipeline_stage = 1, pipeline_status = 'running' WHERE id = ?", (eval_id,))

        # Fetch vendors & documents
        cursor.execute("SELECT * FROM vendors WHERE evaluation_id = ?", (eval_id,))
        vendors = [dict(v) for v in cursor.fetchall()]
        if not vendors:
            raise HTTPException(status_code=400, detail="No vendors found for evaluation")

        # Fetch requirements
        cursor.execute("SELECT * FROM requirements WHERE evaluation_id = ?", (eval_id,))
        requirements = [dict(r) for r in cursor.fetchall()]

        # Fetch usage assumptions
        cursor.execute("SELECT * FROM usage_assumptions WHERE evaluation_id = ?", (eval_id,))
        assump_row = cursor.fetchone()
        assumptions = dict(assump_row) if assump_row else {"user_count": 1000}

        # Fetch scoring weights
        cursor.execute("SELECT * FROM scoring_weights WHERE evaluation_id = ?", (eval_id,))
        weights_row = cursor.fetchone()
        weights = dict(weights_row) if weights_row else {}

        # Clean existing analysis records for this evaluation
        cursor.execute("DELETE FROM extracted_facts WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM risks WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM missing_information WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM requirement_matches WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM tco_results WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM score_results WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM recommendations WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM negotiation_questions WHERE evaluation_id = ?", (eval_id,))
        cursor.execute("DELETE FROM negotiation_items WHERE evaluation_id = ?", (eval_id,))

        all_req_matches = []
        all_risks = []
        vendor_tco_map = {}
        vendor_disqual_info = []

        # Process each vendor proposal
        for v in vendors:
            v_id = v["id"]
            v_name = v["name"]

            # Fetch vendor documents
            cursor.execute("SELECT * FROM vendor_documents WHERE vendor_id = ?", (v_id,))
            docs = [dict(d) for d in cursor.fetchall()]
            if not docs:
                continue

            doc = docs[0]
            doc_id = doc["id"]

            # Fetch document pages
            cursor.execute("SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number ASC", (doc_id,))
            pages = [dict(p) for p in cursor.fetchall()]
            page_text_map = {p["page_number"]: p["text_content"] for p in pages}

            # 1. AI Fact, Red-Team Risk, Compliance, and Negotiation Extraction
            extracted = LLMService.analyze_vendor_document(v_name, pages, requirements, assumptions)

            # Store Evidence and Facts
            fact_pricing = {}
            for f in extracted.get("facts", []):
                quote = f.get("quote", "")
                p_num = f.get("page_number", 1)
                sec = f.get("section_title", "General")
                
                # Evidence Verification against actual page text
                p_text = page_text_map.get(p_num, "")
                verification = EvidenceVerifier.verify_quote(quote, p_text)

                ev_id = f"ev_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO evidence (id, document_id, vendor_id, page_number, section_title, quote, verified, char_offset, match_confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (ev_id, doc_id, v_id, p_num, sec, quote, 1 if verification["verified"] else 0, verification["char_offset"], verification["match_confidence"]))

                fact_id = f"fact_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO extracted_facts (id, vendor_id, evaluation_id, category, field_name, label, value_raw, value_normalized, unit, evidence_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (fact_id, v_id, eval_id, f.get("category", "general"), f.get("field_name", ""), f.get("label", ""), f.get("value_raw"), f.get("value_normalized"), f.get("unit"), ev_id))

                field_n = f.get("field_name", "")
                if field_n in ["implementation_fee", "year1_license", "annual_support", "escalation_rate"]:
                    try:
                        fact_pricing[field_n] = float(f.get("value_normalized", 0.0))
                    except Exception:
                        pass

            # Store Requirement Matches (Compliance Matrix)
            for r_match in extracted.get("requirements_evaluation", []):
                req_id = r_match.get("requirement_id")
                quote = r_match.get("quote", "")
                p_num = r_match.get("page_number", 1)
                sec = r_match.get("section_title", "General")

                p_text = page_text_map.get(p_num, "")
                verification = EvidenceVerifier.verify_quote(quote, p_text)

                ev_id = f"ev_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO evidence (id, document_id, vendor_id, page_number, section_title, quote, verified, char_offset, match_confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (ev_id, doc_id, v_id, p_num, sec, quote, 1 if verification["verified"] else 0, verification["char_offset"], verification["match_confidence"]))

                match_id = f"rm_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO requirement_matches (id, requirement_id, vendor_id, evaluation_id, status, failure_reason, details, evidence_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (match_id, req_id, v_id, eval_id, r_match.get("status", "UNKNOWN"), r_match.get("failure_reason"), r_match.get("details"), ev_id))

                all_req_matches.append({
                    "requirement_id": req_id,
                    "vendor_id": v_id,
                    "status": r_match.get("status", "UNKNOWN"),
                    "failure_reason": r_match.get("failure_reason")
                })

            # Store Red-Team Risks
            for r in extracted.get("risks", []):
                quote = r.get("quote", "")
                p_num = r.get("page_number", 1)
                sec = r.get("section_title", "Risk Analysis")

                p_text = page_text_map.get(p_num, "")
                verification = EvidenceVerifier.verify_quote(quote, p_text)

                ev_id = f"ev_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO evidence (id, document_id, vendor_id, page_number, section_title, quote, verified, char_offset, match_confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (ev_id, doc_id, v_id, p_num, sec, quote, 1 if verification["verified"] else 0, verification["char_offset"], verification["match_confidence"]))

                risk_id = f"risk_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO risks (id, vendor_id, evaluation_id, category, risk_type, severity, title, description, impact, recommended_action, why_it_matters, evidence_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    risk_id, v_id, eval_id,
                    r.get("category", "Contractual / Legal"),
                    r.get("risk_type", "contractual"),
                    r.get("severity", "MEDIUM"),
                    r.get("title", ""),
                    r.get("description", ""),
                    r.get("impact", r.get("why_it_matters", "")),
                    r.get("recommended_action", ""),
                    r.get("why_it_matters", ""),
                    ev_id
                ))

                all_risks.append({
                    "vendor_id": v_id,
                    "severity": r.get("severity", "MEDIUM"),
                    "title": r.get("title", "")
                })

            # Store Negotiation Items (Feature 3)
            for ni in extracted.get("negotiation_items", []):
                quote = ni.get("quote", "")
                p_num = ni.get("page_number", 1)
                sec = ni.get("section_title", "Commercial & Legal Terms")

                p_text = page_text_map.get(p_num, "")
                verification = EvidenceVerifier.verify_quote(quote, p_text)

                ev_id = f"ev_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO evidence (id, document_id, vendor_id, page_number, section_title, quote, verified, char_offset, match_confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (ev_id, doc_id, v_id, p_num, sec, quote, 1 if verification["verified"] else 0, verification["char_offset"], verification["match_confidence"]))

                ni_id = f"ni_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO negotiation_items (id, evaluation_id, vendor_id, priority, issue, current_position, target_position, fallback_position, buyer_rationale, vendor_rationale, evidence_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ni_id, eval_id, v_id,
                    ni.get("priority", "HIGH"),
                    ni.get("issue", ""),
                    ni.get("current_position", ""),
                    ni.get("target_position", ""),
                    ni.get("fallback_position", ""),
                    ni.get("buyer_rationale", ""),
                    ni.get("vendor_rationale", ""),
                    ev_id
                ))

            # Store Missing Info
            for m in extracted.get("missing_information", []):
                m_id = f"miss_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO missing_information (id, vendor_id, evaluation_id, category, field_name, impact_level, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (m_id, v_id, eval_id, m.get("category", "General"), m.get("field_name", ""), m.get("impact_level", "MEDIUM"), m.get("description", "")))

            # 2. Deterministic 3-Year TCO Calculation (Python Engine)
            tco_calc = TCOCalculator.calculate_3year_tco(
                implementation_fee=fact_pricing.get("implementation_fee"),
                annual_license_yr1=fact_pricing.get("year1_license"),
                annual_support_yr1=fact_pricing.get("annual_support"),
                escalation_rate=fact_pricing.get("escalation_rate", 0.0),
                user_count=assumptions.get("user_count", 1000)
            )
            vendor_tco_map[v_id] = tco_calc

            tco_id = f"tco_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO tco_results (
                    id, vendor_id, evaluation_id, implementation_fee, year1_license, year2_license, year3_license,
                    year1_support, year2_support, year3_support, escalation_rate, overage_estimate,
                    year1_total, year2_total, year3_total, total_3yr_tco, cost_per_user_year, is_complete,
                    missing_cost_items, breakdown_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tco_id, v_id, eval_id,
                tco_calc["implementation_fee"], tco_calc["year1_license"], tco_calc["year2_license"], tco_calc["year3_license"],
                tco_calc["year1_support"], tco_calc["year2_support"], tco_calc["year3_support"],
                tco_calc["escalation_rate"], tco_calc["overage_estimate"],
                tco_calc["year1_total"], tco_calc["year2_total"], tco_calc["year3_total"],
                tco_calc["total_3yr_tco"], tco_calc["cost_per_user_year"], 1 if tco_calc["is_complete"] else 0,
                json.dumps(tco_calc["missing_cost_items"]), json.dumps(tco_calc["breakdown"])
            ))

            # 3. Deterministic Kill-Criteria Evaluation
            mandatory_reqs = [r for r in requirements if r.get("is_mandatory")]
            kill_eval = KillCriteriaGate.evaluate_vendor(v_id, v_name, mandatory_reqs, all_req_matches)
            v["is_disqualified"] = kill_eval["is_disqualified"]
            v["disqualification_reason"] = kill_eval["disqualification_reason"]
            if kill_eval["is_disqualified"]:
                vendor_disqual_info.append(kill_eval)

        # 4. Deterministic Multi-Criteria Weighted Scoring & Ranking (Python Engine)
        ranked_scores = ScoringEngine.calculate_scores(
            vendors=vendors,
            tco_data=vendor_tco_map,
            req_matches=all_req_matches,
            requirements=requirements,
            risks=all_risks,
            weights=weights
        )

        for s in ranked_scores:
            s_id = f"score_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO score_results (
                    id, vendor_id, evaluation_id, total_score, tco_score, technical_score,
                    compliance_score, risk_score, sla_score, rank, is_disqualified, disqualification_reason
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s_id, s["vendor_id"], eval_id,
                s["total_score"], s["tco_score"], s["technical_score"],
                s["compliance_score"], s["risk_score"], s["sla_score"],
                s["rank"], 1 if s["is_disqualified"] else 0, s["disqualification_reason"]
            ))

        # 5. Executive Recommendation & Negotiation Questions Generation
        risks_by_vendor = {}
        for r in all_risks:
            risks_by_vendor.setdefault(r["vendor_id"], []).append(r)

        recs = LLMService.generate_recommendation_and_questions(
            evaluation_title=eval_row["title"],
            ranked_vendors=ranked_scores,
            tco_data=vendor_tco_map,
            risks_by_vendor=risks_by_vendor,
            disqualified_vendors=vendor_disqual_info
        )

        # Store Recommendation
        rec_id = f"rec_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO recommendations (id, evaluation_id, top_vendor_id, executive_summary, recommendation_narrative, trade_off_analysis)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (rec_id, eval_id, recs["top_vendor_id"], recs["executive_summary"], recs["recommendation_narrative"], recs["trade_off_analysis"]))

        # Store Negotiation Questions
        for q in recs.get("negotiation_questions", []):
            q_id = f"nq_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO negotiation_questions (id, vendor_id, evaluation_id, priority, category, question, rationale, target_clause, suggested_fallback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (q_id, q["vendor_id"], eval_id, q.get("priority", "HIGH"), q.get("category", "Commercial"), q.get("question", ""), q.get("rationale", ""), q.get("target_clause"), q.get("suggested_fallback")))

        # Update evaluation status
        cursor.execute("UPDATE evaluations SET status = 'analyzed', pipeline_stage = 6, pipeline_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (eval_id,))

        return {
            "status": "completed",
            "message": "Pipeline completed successfully with verified evidence, red-team analysis, and deterministic scores.",
            "ranked_vendors": ranked_scores,
            "top_vendor_id": recs["top_vendor_id"]
        }
