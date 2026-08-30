import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from ..database import get_db
from ..config import UPLOADS_DIR, SAMPLES_DIR
from ..services.pdf_parser import PDFParserService
from ..samples.generate_sample_pdfs import create_sample_pdfs

router = APIRouter(prefix="/api", tags=["documents"])

@router.post("/evaluations/{eval_id}/documents/upload")
async def upload_vendor_document(
    eval_id: str,
    file: UploadFile = File(...),
    vendor_name: Optional[str] = Form(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM evaluations WHERE id = ?", (eval_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Evaluation not found.")

        # Determine vendor name from form or filename
        name = vendor_name or Path(file.filename).stem.replace("_", " ").replace("-", " ")
        
        # Find or create vendor
        cursor.execute("SELECT id FROM vendors WHERE evaluation_id = ? AND name = ?", (eval_id, name))
        v_row = cursor.fetchone()
        if v_row:
            vendor_id = v_row["id"]
        else:
            vendor_id = f"vend_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO vendors (id, evaluation_id, name)
                VALUES (?, ?, ?)
            """, (vendor_id, eval_id, name))

        # Save file to uploads directory
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        file_ext = Path(file.filename).suffix
        saved_filename = f"{doc_id}_{file.filename}"
        saved_path = UPLOADS_DIR / saved_filename

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = saved_path.stat().st_size

        # Parse PDF and anchor pages
        try:
            parsed_result = PDFParserService.parse_pdf(saved_path)
            page_count = parsed_result["page_count"]
            pages = parsed_result["pages"]
            doc_status = "parsed"
            error_msg = None
        except Exception as parse_err:
            page_count = 0
            pages = []
            doc_status = "failed"
            error_msg = str(parse_err)

        # Store document record
        cursor.execute("""
            INSERT INTO vendor_documents (id, evaluation_id, vendor_id, filename, file_path, file_size, page_count, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (doc_id, eval_id, vendor_id, file.filename, str(saved_path), file_size, page_count, doc_status, error_msg))

        # Store page-anchored text
        for p in pages:
            page_id = f"page_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO document_pages (id, document_id, page_number, text_content, char_count)
                VALUES (?, ?, ?, ?, ?)
            """, (page_id, doc_id, p["page_number"], p["text_content"], p["char_count"]))

        # Update evaluation status
        cursor.execute("""
            UPDATE evaluations 
            SET status = 'documents_uploaded', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (eval_id,))

        return {
            "document_id": doc_id,
            "vendor_id": vendor_id,
            "vendor_name": name,
            "filename": file.filename,
            "page_count": page_count,
            "file_size": file_size,
            "status": doc_status,
            "error_message": error_msg,
            "message": f"Successfully parsed and anchored {page_count} pages."
        }

@router.get("/evaluations/{eval_id}/documents")
def list_documents(eval_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.*, v.name as vendor_name 
            FROM vendor_documents d
            JOIN vendors v ON d.vendor_id = v.id
            WHERE d.evaluation_id = ?
            ORDER BY d.created_at ASC
        """, (eval_id,))
        return [dict(r) for r in cursor.fetchall()]

@router.get("/documents/{doc_id}/pages/{page_num}")
def get_document_page(doc_id: str, page_num: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, d.filename, v.name as vendor_name
            FROM document_pages p
            JOIN vendor_documents d ON p.document_id = d.id
            JOIN vendors v ON d.vendor_id = v.id
            WHERE p.document_id = ? AND p.page_number = ?
        """, (doc_id, page_num))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Page not found")
        return dict(row)

@router.post("/evaluations/{eval_id}/seed-sample-documents")
def seed_sample_documents(eval_id: str):
    """
    Seeds the evaluation with the 3 generated realistic vendor proposals.
    """
    sample_pdf_dir = SAMPLES_DIR / "generated_pdfs"
    if not sample_pdf_dir.exists() or len(list(sample_pdf_dir.glob("*.pdf"))) < 3:
        create_sample_pdfs(sample_pdf_dir)

    vendors_to_seed = [
        {"name": "CloudCore", "filename": "CloudCore_Enterprise_Proposal_2024.pdf"},
        {"name": "Vertex Systems", "filename": "Vertex_Enterprise_Solution_2024.pdf"},
        {"name": "Nexus Cloud", "filename": "NexusCloud_Enterprise_Proposal_2024.pdf"}
    ]

    seeded_docs = []
    with get_db() as conn:
        cursor = conn.cursor()
        
        for item in vendors_to_seed:
            source_file = sample_pdf_dir / item["filename"]
            if not source_file.exists():
                continue

            # Create vendor
            vendor_id = f"vend_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO vendors (id, evaluation_id, name)
                VALUES (?, ?, ?)
            """, (vendor_id, eval_id, item["name"]))

            # Copy file
            doc_id = f"doc_{uuid.uuid4().hex[:8]}"
            dest_file = UPLOADS_DIR / f"{doc_id}_{item['filename']}"
            shutil.copyfile(source_file, dest_file)
            file_size = dest_file.stat().st_size

            # Parse
            parsed = PDFParserService.parse_pdf(dest_file)
            page_count = parsed["page_count"]

            cursor.execute("""
                INSERT INTO vendor_documents (id, evaluation_id, vendor_id, filename, file_path, file_size, page_count, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'parsed')
            """, (doc_id, eval_id, vendor_id, item["filename"], str(dest_file), file_size, page_count))

            for p in parsed["pages"]:
                page_id = f"page_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO document_pages (id, document_id, page_number, text_content, char_count)
                    VALUES (?, ?, ?, ?, ?)
                """, (page_id, doc_id, p["page_number"], p["text_content"], p["char_count"]))

            seeded_docs.append({
                "vendor_id": vendor_id,
                "vendor_name": item["name"],
                "document_id": doc_id,
                "filename": item["filename"],
                "page_count": page_count
            })

        cursor.execute("UPDATE evaluations SET status = 'documents_uploaded' WHERE id = ?", (eval_id,))

    return {"message": "3 sample vendor proposals seeded successfully", "documents": seeded_docs}
