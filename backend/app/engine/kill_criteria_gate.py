from typing import List, Dict, Any

class KillCriteriaGate:
    @staticmethod
    def evaluate_vendor(
        vendor_id: str,
        vendor_name: str,
        mandatory_requirements: List[Dict[str, Any]],
        requirement_matches: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates mandatory kill-criteria for a vendor.
        Returns disqualification status and detailed reason if disqualified.
        """
        failed_mandatory: List[str] = []

        match_map = {m["requirement_id"]: m for m in requirement_matches if m.get("vendor_id") == vendor_id}

        for req in mandatory_requirements:
            req_id = req["id"]
            req_title = req["title"]
            match = match_map.get(req_id)

            if not match:
                failed_mandatory.append(f"Unverified compliance for mandatory requirement: '{req_title}'")
            elif match.get("status") in ["NOT_MET", "FAILED", "FAIL"]:
                reason = match.get("failure_reason") or "Requirement criteria not satisfied"
                failed_mandatory.append(f"Failed '{req_title}': {reason}")

        is_disqualified = len(failed_mandatory) > 0
        disqualification_reason = " | ".join(failed_mandatory) if is_disqualified else None

        return {
            "vendor_id": vendor_id,
            "vendor_name": vendor_name,
            "is_disqualified": is_disqualified,
            "disqualification_reason": disqualification_reason,
            "failed_count": len(failed_mandatory),
            "failed_items": failed_mandatory
        }
