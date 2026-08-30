import uuid
from fastapi import APIRouter
from ..database import get_db
from ..models.schemas import EvaluationCreate
from ..routers.evaluations import create_evaluation
from ..routers.documents import seed_sample_documents
from ..routers.pipeline import run_analytical_pipeline

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.post("/reset")
def demo_reset():
    """
    Safely resets all demo evaluations, documents, and calculation records in the SQLite database.
    Does not modify any application configuration or code files.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM extracted_facts")
        cursor.execute("DELETE FROM risks")
        cursor.execute("DELETE FROM missing_information")
        cursor.execute("DELETE FROM requirement_matches")
        cursor.execute("DELETE FROM tco_results")
        cursor.execute("DELETE FROM score_results")
        cursor.execute("DELETE FROM recommendations")
        cursor.execute("DELETE FROM negotiation_questions")
        cursor.execute("DELETE FROM evidence")
        cursor.execute("DELETE FROM document_pages")
        cursor.execute("DELETE FROM vendor_documents")
        cursor.execute("DELETE FROM vendors")
        cursor.execute("DELETE FROM scoring_weights")
        cursor.execute("DELETE FROM usage_assumptions")
        cursor.execute("DELETE FROM requirements")
        cursor.execute("DELETE FROM evaluations")
        conn.commit()

    return {
        "status": "success",
        "message": "Demo environment reset successfully. Database is clean."
    }

@router.post("/seed")
def demo_seed():
    """
    Recreates the standard 3-vendor demonstration scenario:
    1. Creates 'Enterprise Cloud Analytics RFP' evaluation
    2. Seeds 3 vendor proposals: CloudCore, Vertex Systems, Nexus Cloud
    3. Executes the full analytical pipeline
    4. Nexus Cloud is disqualified on mandatory SOC 2 Type II gate
    5. Vertex Systems has 7% escalator risk
    6. CloudCore is top award winner
    """
    # Create evaluation
    eval_in = EvaluationCreate(
        title="Enterprise Cloud Analytics RFP",
        category="Cloud Infrastructure & AI",
        description="Comprehensive 3-Year Enterprise Procurement RFP Evaluation for 1,000 Global Users."
    )
    create_res = create_evaluation(eval_in)
    eval_id = create_res["id"]

    # Seed 3 proposals
    seed_res = seed_sample_documents(eval_id)

    # Run analytical pipeline
    pipe_res = run_analytical_pipeline(eval_id)

    return {
        "status": "success",
        "evaluation_id": eval_id,
        "message": "3-Vendor demo scenario seeded and analyzed successfully.",
        "top_vendor_id": pipe_res.get("top_vendor_id"),
        "documents": seed_res.get("documents", [])
    }
