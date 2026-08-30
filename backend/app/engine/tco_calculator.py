from typing import Dict, Any, List, Optional

class TCOCalculator:
    @staticmethod
    def calculate_3year_tco(
        implementation_fee: Optional[float],
        annual_license_yr1: Optional[float],
        annual_support_yr1: Optional[float],
        escalation_rate: float = 0.0,
        overage_estimate_yr1: float = 0.0,
        user_count: int = 1000
    ) -> Dict[str, Any]:
        """
        Deterministically computes the 3-Year Total Cost of Ownership (TCO).
        Compound escalation is applied to license and recurring support fees for Years 2 and 3.
        Flags missing components and NEVER assumes missing price is $0.
        """
        missing_items: List[str] = []
        
        if implementation_fee is None:
            missing_items.append("Implementation Fee")
        if annual_license_yr1 is None:
            missing_items.append("Base Annual Software License")
        if annual_support_yr1 is None:
            missing_items.append("Annual Support & Maintenance Fee")

        is_complete = len(missing_items) == 0

        # Safe defaults for calculation display while flagged incomplete
        impl = implementation_fee if implementation_fee is not None else 0.0
        lic1 = annual_license_yr1 if annual_license_yr1 is not None else 0.0
        sup1 = annual_support_yr1 if annual_support_yr1 is not None else 0.0
        esc = max(0.0, min(escalation_rate, 1.0))
        overage1 = overage_estimate_yr1 or 0.0

        # Year 1
        y1_license = lic1
        y1_support = sup1
        y1_overage = overage1
        y1_total = impl + y1_license + y1_support + y1_overage

        # Year 2 (license & support escalated)
        y2_license = lic1 * (1.0 + esc)
        y2_support = sup1 * (1.0 + esc)
        y2_overage = overage1 * (1.0 + esc)
        y2_total = y2_license + y2_support + y2_overage

        # Year 3 (compound escalation)
        y3_license = lic1 * ((1.0 + esc) ** 2)
        y3_support = sup1 * ((1.0 + esc) ** 2)
        y3_overage = overage1 * ((1.0 + esc) ** 2)
        y3_total = y3_license + y3_support + y3_overage

        total_3yr = y1_total + y2_total + y3_total
        effective_users = max(1, user_count)
        cost_per_user_year = total_3yr / (3.0 * effective_users)

        return {
            "implementation_fee": round(impl, 2),
            "year1_license": round(y1_license, 2),
            "year2_license": round(y2_license, 2),
            "year3_license": round(y3_license, 2),
            "year1_support": round(y1_support, 2),
            "year2_support": round(y2_support, 2),
            "year3_support": round(y3_support, 2),
            "escalation_rate": round(esc, 4),
            "overage_estimate": round(overage1, 2),
            "year1_total": round(y1_total, 2),
            "year2_total": round(y2_total, 2),
            "year3_total": round(y3_total, 2),
            "total_3yr_tco": round(total_3yr, 2),
            "cost_per_user_year": round(cost_per_user_year, 2),
            "is_complete": is_complete,
            "missing_cost_items": missing_items,
            "breakdown": {
                "year1": {"implementation": round(impl, 2), "license": round(y1_license, 2), "support": round(y1_support, 2), "overage": round(y1_overage, 2), "total": round(y1_total, 2)},
                "year2": {"license": round(y2_license, 2), "support": round(y2_support, 2), "overage": round(y2_overage, 2), "total": round(y2_total, 2)},
                "year3": {"license": round(y3_license, 2), "support": round(y3_support, 2), "overage": round(y3_overage, 2), "total": round(y3_total, 2)},
            }
        }
