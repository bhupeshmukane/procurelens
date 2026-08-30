import re
from typing import Dict, Any

class EvidenceVerifier:
    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        # Lowercase, replace various quote characters, normalize whitespace
        t = text.lower()
        t = re.sub(r'[\u2018\u2019\u201a\u201b\u2032\u2035\']', "'", t)
        t = re.sub(r'[\u201c\u201d\u201e\u201f\u2033\u2036\"]', '"', t)
        t = re.sub(r'[\u2013\u2014]', '-', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    @classmethod
    def verify_quote(cls, quote: str, page_text: str) -> Dict[str, Any]:
        """
        Verifies whether an extracted quote is present in the specified page text.
        Returns verification boolean, character offset, and confidence score.
        """
        if not quote or not page_text:
            return {"verified": False, "char_offset": -1, "match_confidence": 0.0}

        # 1. Exact raw match
        if quote in page_text:
            return {
                "verified": True,
                "char_offset": page_text.index(quote),
                "match_confidence": 1.0
            }

        # 2. Normalized substring match
        norm_quote = cls.normalize_text(quote)
        norm_page = cls.normalize_text(page_text)

        if norm_quote in norm_page:
            offset = norm_page.index(norm_quote)
            return {
                "verified": True,
                "char_offset": offset,
                "match_confidence": 0.95
            }

        # 3. Sliding window token overlap match for minor OCR / line break discrepancies
        quote_words = [w for w in re.split(r'\W+', norm_quote) if len(w) > 2]
        if not quote_words:
            return {"verified": False, "char_offset": -1, "match_confidence": 0.0}

        page_words = [w for w in re.split(r'\W+', norm_page) if len(w) > 2]
        
        matches = sum(1 for w in quote_words if w in page_words)
        overlap_ratio = matches / len(quote_words)

        if overlap_ratio >= 0.85 and len(quote_words) >= 4:
            return {
                "verified": True,
                "char_offset": 0,
                "match_confidence": round(overlap_ratio, 2)
            }

        return {
            "verified": False,
            "char_offset": -1,
            "match_confidence": round(overlap_ratio, 2)
        }
