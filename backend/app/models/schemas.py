from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RequirementCreate(BaseModel):
    category: str
    title: str
    name: Optional[str] = None
    description: Optional[str] = ""
    priority: str = "MUST_HAVE" # MUST_HAVE, SHOULD_HAVE, NICE_TO_HAVE
    is_mandatory: bool = True
    weight: int = 1
    evaluation_type: str = "BOOLEAN" # BOOLEAN, SCORE, TEXT, NUMERIC

class RequirementUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    is_mandatory: Optional[bool] = None
    weight: Optional[int] = None
    evaluation_type: Optional[str] = None

class RequirementOut(BaseModel):
    id: str
    evaluation_id: str
    category: str
    title: str
    name: Optional[str] = None
    description: Optional[str] = ""
    priority: str = "MUST_HAVE"
    is_mandatory: bool = True
    weight: int = 1
    evaluation_type: str = "BOOLEAN"

class UsageAssumptionsCreate(BaseModel):
    user_count: int = 1000
    storage_tb: float = 50.0
    support_tier: str = "24/7 Enterprise Platinum"
    annual_growth_rate: float = 0.15
    contract_term_years: int = 3

class UsageAssumptionsOut(UsageAssumptionsCreate):
    id: str
    evaluation_id: str

class ScoringWeightsUpdate(BaseModel):
    weight_tco: float = 35.0
    weight_technical: float = 25.0
    weight_compliance: float = 20.0
    weight_risk: float = 10.0
    weight_sla: float = 10.0

class ScoringWeightsOut(ScoringWeightsUpdate):
    id: str
    evaluation_id: str

class EvaluationCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""
    requirements: Optional[List[RequirementCreate]] = []
    assumptions: Optional[UsageAssumptionsCreate] = None
    weights: Optional[ScoringWeightsUpdate] = None

class DocumentPageOut(BaseModel):
    id: str
    page_number: int
    text_content: str
    char_count: int

class VendorDocumentOut(BaseModel):
    id: str
    evaluation_id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    filename: str
    file_size: int
    page_count: int
    status: str
    error_message: Optional[str] = None
    created_at: str

class VendorOut(BaseModel):
    id: str
    name: str
    evaluation_id: str
    logo_url: Optional[str] = None
    summary: Optional[str] = None
    documents: List[VendorDocumentOut] = []

class EvidenceOut(BaseModel):
    id: str
    document_id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    document_name: Optional[str] = None
    page_number: int
    section_title: Optional[str] = None
    quote: str
    verified: bool
    char_offset: int = -1
    match_confidence: float = 1.0

class ExtractedFactOut(BaseModel):
    id: str
    vendor_id: str
    category: str
    field_name: str
    label: str
    value_raw: Optional[str] = None
    value_normalized: Optional[str] = None
    unit: Optional[str] = None
    is_missing: bool = False
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceOut] = None

class MissingInfoOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    category: str
    field_name: str
    impact_level: str
    description: Optional[str] = None

class RiskOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    category: str = "Commercial / Financial"
    risk_type: str
    severity: str # CRITICAL, HIGH, MEDIUM, LOW
    title: str
    description: str
    impact: Optional[str] = None
    recommended_action: Optional[str] = None
    why_it_matters: Optional[str] = None
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceOut] = None

class RequirementMatchOut(BaseModel):
    id: str
    requirement_id: str
    requirement_title: str
    requirement_category: str
    is_mandatory: bool
    vendor_id: str
    vendor_name: Optional[str] = None
    status: str # PASS, FAIL, PARTIAL, UNKNOWN, NOT_APPLICABLE
    failure_reason: Optional[str] = None
    details: Optional[str] = None
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceOut] = None

class TCOResultOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    implementation_fee: float
    year1_license: float
    year2_license: float
    year3_license: float
    year1_support: float
    year2_support: float
    year3_support: float
    escalation_rate: float
    overage_estimate: float
    year1_total: float
    year2_total: float
    year3_total: float
    total_3yr_tco: float
    cost_per_user_year: float
    is_complete: bool
    missing_cost_items: Optional[List[str]] = []
    breakdown_json: Optional[Dict[str, Any]] = None

class ScoreResultOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    total_score: float
    tco_score: float
    technical_score: float
    compliance_score: float
    risk_score: float
    sla_score: float
    rank: int
    is_disqualified: bool
    disqualification_reason: Optional[str] = None

class NegotiationItemOut(BaseModel):
    id: str
    evaluation_id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    priority: str # HIGH, MEDIUM, LOW
    issue: str
    current_position: str
    target_position: str
    fallback_position: str
    buyer_rationale: Optional[str] = None
    vendor_rationale: Optional[str] = None
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceOut] = None

class NegotiationQuestionOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    priority: str
    category: str
    question: str
    rationale: str
    target_clause: Optional[str] = None
    suggested_fallback: Optional[str] = None

class RecommendationOut(BaseModel):
    id: str
    evaluation_id: str
    top_vendor_id: Optional[str] = None
    top_vendor_name: Optional[str] = None
    executive_summary: Optional[str] = None
    recommendation_narrative: Optional[str] = None
    trade_off_analysis: Optional[str] = None

class EvaluationDetailOut(BaseModel):
    id: str
    title: str
    category: str
    description: Optional[str] = ""
    status: str
    pipeline_stage: int
    pipeline_status: str
    created_at: str
    updated_at: str
    requirements: List[RequirementOut] = []
    assumptions: Optional[UsageAssumptionsOut] = None
    weights: Optional[ScoringWeightsOut] = None
    vendors: List[VendorOut] = []
    tco_results: List[TCOResultOut] = []
    score_results: List[ScoreResultOut] = []
    risks: List[RiskOut] = []
    requirement_matches: List[RequirementMatchOut] = []
    missing_information: List[MissingInfoOut] = []
    recommendation: Optional[RecommendationOut] = None
    negotiation_questions: List[NegotiationQuestionOut] = []
    negotiation_items: List[NegotiationItemOut] = []

# --- Phase 2 Decision Simulator Schemas ---
class SimulationWeightsIn(BaseModel):
    weight_tco: Optional[float] = 35.0
    weight_technical: Optional[float] = 25.0
    weight_compliance: Optional[float] = 20.0
    weight_risk: Optional[float] = 10.0
    weight_sla: Optional[float] = 10.0

class SimulationTCOIn(BaseModel):
    vendor_id: Optional[str] = None
    escalation_rate: Optional[float] = None
    implementation_fee: Optional[float] = None
    annual_license_yr1: Optional[float] = None
    annual_support_yr1: Optional[float] = None
    user_count: Optional[int] = 1000
    contract_years: Optional[int] = 3

class SimulationRequest(BaseModel):
    scenario_name: Optional[str] = "Custom What-If Scenario"
    weights: Optional[SimulationWeightsIn] = None
    tco_assumptions: Optional[SimulationTCOIn] = None
    requirement_overrides: Optional[Dict[str, str]] = None

# --- Phase 4 Decision Trace & Decision Pack Schemas ---
class JustificationPillar(BaseModel):
    key: str # compliance, tco, risk, technical, sla
    title: str
    detail: str
    evidence_id: Optional[str] = None
    evidence_quote: Optional[str] = None
    evidence_page: Optional[int] = None
    section_title: Optional[str] = None
    verified: Optional[bool] = True

class WhyNotCheapest(BaseModel):
    vendor_id: str
    vendor_name: str
    nominal_3yr_tco: float
    failed_requirement: str
    status: str
    explanation: str
    evidence_id: Optional[str] = None
    evidence_quote: Optional[str] = None
    evidence_page: Optional[int] = None
    section_title: Optional[str] = None

class CriterionContribution(BaseModel):
    key: str
    label: str
    weight: float
    raw_score: float
    weighted_contribution: float

class VendorContribution(BaseModel):
    vendor_id: str
    vendor_name: str
    rank: int
    total_score: float
    is_disqualified: bool
    disqualification_reason: Optional[str] = None
    contributions: List[CriterionContribution]

class DecisionTraceOut(BaseModel):
    evaluation_id: str
    evaluation_title: str
    recommended_vendor: Optional[ScoreResultOut] = None
    why_vendor_won: List[JustificationPillar] = []
    why_not_cheapest: Optional[WhyNotCheapest] = None
    score_contributions: List[VendorContribution] = []
    key_risks_summary: List[Dict[str, Any]] = []
    negotiation_opportunity: Optional[Dict[str, Any]] = None


