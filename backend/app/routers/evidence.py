from fastapi import APIRouter, HTTPException
from ..database import get_db

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

@router.get("/{evidence_id}")
def get_evidence_detail(evidence_id: str):
    """
    Retrieves evidence details including document metadata, page text, verified status, and exact quote.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, d.filename as document_name, v.name as vendor_name, p.text_content as page_text
            FROM evidence e
            JOIN vendor_documents d ON e.document_id = d.id
            JOIN vendors v ON e.vendor_id = v.id
            LEFT JOIN document_pages p ON e.document_id = p.document_id AND e.page_number = p.page_number
            WHERE e.id = ?
        """, (evidence_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Evidence item not found")
        
        rd = dict(row)
        rd["verified"] = bool(rd["verified"])
        return rd
