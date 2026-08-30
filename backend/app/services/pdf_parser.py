import re
from typing import List, Dict, Any
from pathlib import Path
import pypdf

class PDFParserService:
    @staticmethod
    def parse_pdf(file_path: Path) -> Dict[str, Any]:
        """
        Parses a PDF file page by page, anchoring text content to exact page numbers.
        Returns metadata and page text records.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found at {file_path}")

        try:
            reader = pypdf.PdfReader(str(file_path))
            total_pages = len(reader.pages)
            pages_data = []

            for index, page in enumerate(reader.pages):
                page_num = index + 1
                try:
                    raw_text = page.extract_text() or ""
                    # Normalize excessive whitespace but preserve line breaks
                    clean_text = re.sub(r'[ \t]+', ' ', raw_text).strip()
                    char_count = len(clean_text)
                    pages_data.append({
                        "page_number": page_num,
                        "text_content": clean_text,
                        "char_count": char_count
                    })
                except Exception as page_err:
                    pages_data.append({
                        "page_number": page_num,
                        "text_content": f"[Error extracting text from page {page_num}: {str(page_err)}]",
                        "char_count": 0
                    })

            return {
                "page_count": total_pages,
                "pages": pages_data,
                "is_scanned": all(p["char_count"] < 20 for p in pages_data) if total_pages > 0 else False
            }
        except Exception as e:
            raise RuntimeError(f"Failed to parse PDF {file_path.name}: {str(e)}")
