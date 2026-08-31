const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface Requirement {
  id?: string;
  category: string;
  title: string;
  name?: string;
  description?: string;
  priority?: 'MUST_HAVE' | 'SHOULD_HAVE' | 'NICE_TO_HAVE';
  is_mandatory: boolean;
  weight?: number;
  evaluation_type?: 'BOOLEAN' | 'SCORE' | 'TEXT' | 'NUMERIC';
}

export interface UsageAssumptions {
  id?: string;
  user_count: number;
  storage_tb: number;
  support_tier: string;
  annual_growth_rate: number;
  contract_term_years: number;
}

export interface ScoringWeights {
  id?: string;
  weight_tco: number;
  weight_technical: number;
  weight_compliance: number;
  weight_risk: number;
  weight_sla: number;
}

export interface DocumentPage {
  id: string;
  page_number: number;
  text_content: string;
  char_count: number;
}

export interface VendorDocument {
  id: string;
  vendor_id: string;
  vendor_name: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
  summary?: string;
  documents: VendorDocument[];
}

export interface Evidence {
  id: string;
  document_id: string;
  vendor_id: string;
  vendor_name?: string;
  document_name?: string;
  page_number: number;
  section_title?: string;
  quote: string;
  verified: boolean;
  char_offset: number;
  match_confidence?: number;
  page_text?: string;
}

export interface Risk {
  id: string;
  vendor_id: string;
  vendor_name: string;
  category?: string;
  risk_type: 'financial' | 'contractual' | 'compliance' | 'operational';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact?: string;
  recommended_action?: string;
  why_it_matters?: string;
  evidence_id?: string;
  evidence?: Evidence;
}

export interface RequirementMatch {
  id: string;
  requirement_id: string;
  requirement_title: string;
  requirement_category: string;
  is_mandatory: boolean;
  vendor_id: string;
  vendor_name: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'MET' | 'NOT_MET';
  failure_reason?: string;
  details?: string;
  evidence_id?: string;
  evidence?: Evidence;
}

export interface TCOResult {
  id: string;
  vendor_id: string;
  vendor_name: string;
  implementation_fee: number;
  year1_license: number;
  year2_license: number;
  year3_license: number;
  year1_support: number;
  year2_support: number;
  year3_support: number;
  escalation_rate: number;
  overage_estimate: number;
  year1_total: number;
  year2_total: number;
  year3_total: number;
  total_3yr_tco: number;
  cost_per_user_year: number;
  is_complete: boolean;
  missing_cost_items?: string[];
  breakdown_json?: any;
}

export interface ScoreResult {
  id: string;
  vendor_id: string;
  vendor_name: string;
  total_score: number;
  tco_score: number;
  technical_score: number;
  compliance_score: number;
  risk_score: number;
  sla_score: number;
  rank: number;
  is_disqualified: boolean;
  disqualification_reason?: string;
}

export interface NegotiationItem {
  id: string;
  evaluation_id: string;
  vendor_id: string;
  vendor_name?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  current_position: string;
  target_position: string;
  fallback_position: string;
  buyer_rationale?: string;
  vendor_rationale?: string;
  evidence_id?: string;
  evidence?: Evidence;
}

export interface NegotiationQuestion {
  id: string;
  vendor_id: string;
  vendor_name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: string;
  question: string;
  rationale: string;
  target_clause?: string;
  suggested_fallback?: string;
}

export interface Recommendation {
  id: string;
  evaluation_id: string;
  top_vendor_id?: string;
  top_vendor_name?: string;
  executive_summary?: string;
  recommendation_narrative?: string;
  trade_off_analysis?: string;
}

export interface EvaluationDetail {
  id: string;
  title: string;
  category: string;
  description?: string;
  status: string;
  pipeline_stage: number;
  pipeline_status: string;
  created_at: string;
  updated_at: string;
  requirements: Requirement[];
  assumptions?: UsageAssumptions;
  weights?: ScoringWeights;
  vendors: Vendor[];
  tco_results: TCOResult[];
  score_results: ScoreResult[];
  risks: Risk[];
  requirement_matches: RequirementMatch[];
  missing_information: any[];
  recommendation?: Recommendation;
  negotiation_questions: NegotiationQuestion[];
  negotiation_items?: NegotiationItem[];
}

export interface NegotiationBrief {
  vendor_id: string;
  vendor_name: string;
  executive_position: string;
  top_priorities: {
    issue: string;
    priority: string;
    current_position: string;
    target_position: string;
    fallback_position: string;
    buyer_rationale?: string;
    evidence_quote?: string;
    evidence_page?: number;
  }[];
  expected_financial_impact: string;
  recommended_questions: string[];
}

export const api = {
  // Evaluations
  getEvaluations: async () => {
    const res = await fetch(`${API_BASE}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
  },

  getEvaluation: async (id: string): Promise<EvaluationDetail> => {
    const res = await fetch(`${API_BASE}/evaluations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch evaluation detail');
    return res.json();
  },

  createEvaluation: async (data: {
    title: string;
    category: string;
    description?: string;
    requirements?: Requirement[];
    assumptions?: UsageAssumptions;
    weights?: ScoringWeights;
  }) => {
    const res = await fetch(`${API_BASE}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create evaluation');
    return res.json();
  },

  // Requirements CRUD
  addRequirement: async (evalId: string, req: Requirement): Promise<Requirement> => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to add requirement');
    return res.json();
  },

  updateRequirement: async (reqId: string, req: Partial<Requirement>): Promise<Requirement> => {
    const res = await fetch(`${API_BASE}/requirements/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to update requirement');
    return res.json();
  },

  deleteRequirement: async (reqId: string) => {
    const res = await fetch(`${API_BASE}/requirements/${reqId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete requirement');
    return res.json();
  },

  // Compliance Matrix
  getComplianceMatrix: async (evalId: string) => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/compliance`);
    if (!res.ok) throw new Error('Failed to fetch compliance matrix');
    return res.json();
  },

  // Red-Team Analysis
  getRedTeamAnalysis: async (evalId: string) => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/red-team`);
    if (!res.ok) throw new Error('Failed to fetch red-team analysis');
    return res.json();
  },

  // Negotiation Intelligence
  getVendorNegotiation: async (vendorId: string) => {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/negotiation`);
    if (!res.ok) throw new Error('Failed to fetch vendor negotiation items');
    return res.json();
  },

  getNegotiationBrief: async (vendorId: string): Promise<NegotiationBrief> => {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/negotiation/brief`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate negotiation brief');
    return res.json();
  },

  // Documents
  uploadDocument: async (evalId: string, file: File, vendorName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (vendorName) formData.append('vendor_name', vendorName);

    const res = await fetch(`${API_BASE}/evaluations/${evalId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  seedSampleDocuments: async (evalId: string) => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/seed-sample-documents`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to seed sample proposals');
    return res.json();
  },

  // Pipeline Execution
  runPipeline: async (evalId: string) => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/pipeline/run`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to run analysis pipeline');
    }
    return res.json();
  },

  // Instant Deterministic Scoring Rebalance (Measured Timing)
  rebalanceWeights: async (evalId: string, weights: ScoringWeights) => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/weights/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    if (!res.ok) throw new Error('Failed to rebalance weights');
    return res.json();
  },

  // Evidence Detail
  getEvidence: async (evidenceId: string): Promise<Evidence> => {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}`);
    if (!res.ok) throw new Error('Failed to fetch evidence details');
    return res.json();
  },

  // Demo Reset & Seed
  resetDemo: async () => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },

  seedDemo: async () => {
    const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed demo');
    return res.json();
  },

  // Decision Simulator
  runSimulation: async (evalId: string, payload: SimulationPayload): Promise<SimulationResult> => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to run simulation');
    }
    return res.json();
  },

  // Decision Trace & Executive Decision Pack (Phase 4)
  getDecisionTrace: async (evalId: string): Promise<DecisionTrace> => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/decision-trace`);
    if (!res.ok) throw new Error('Failed to fetch decision trace');
    return res.json();
  },

  getDecisionPack: async (evalId: string): Promise<DecisionPack> => {
    const res = await fetch(`${API_BASE}/evaluations/${evalId}/decision-pack`);
    if (!res.ok) throw new Error('Failed to fetch decision pack');
    return res.json();
  },
};

export interface SimulationDriver {
  criterion: string;
  weight_change: string;
  baseline_weight: number;
  scenario_weight: number;
  description: string;
}

export interface RankChange {
  vendor_id: string;
  vendor_name: string;
  baseline_rank: number;
  scenario_rank: number;
  rank_delta: number;
  baseline_score: number;
  scenario_score: number;
  score_delta: number;
  is_disqualified: boolean;
  disqualification_reason?: string;
}

export interface ScoreChange {
  vendor_id: string;
  vendor_name: string;
  score_delta: number;
  tco_score_delta: number;
  technical_score_delta: number;
  compliance_score_delta: number;
  risk_score_delta: number;
  sla_score_delta: number;
}

export interface TCOComparison {
  vendor_id: string;
  vendor_name: string;
  baseline_escalation: number;
  scenario_escalation: number;
  baseline_3yr_tco: number;
  scenario_3yr_tco: number;
  savings_amount: number;
  savings_percentage: number;
  baseline_breakdown: any;
  scenario_breakdown: any;
}

export interface SimulationResult {
  evaluation_id: string;
  scenario_name: string;
  decision_changed: boolean;
  winner_baseline: string;
  winner_scenario: string;
  summary: string;
  baseline: {
    weights: ScoringWeights;
    ranked_vendors: ScoreResult[];
  };
  scenario: {
    weights: ScoringWeights;
    ranked_vendors: ScoreResult[];
    tco_results: TCOResult[];
  };
  rank_changes: RankChange[];
  score_changes: ScoreChange[];
  primary_drivers: SimulationDriver[];
  tco_comparison?: TCOComparison;
  calc_time_ms: number;
  api_time_ms: number;
}

export interface SimulationPayload {
  scenario_name?: string;
  weights?: Partial<ScoringWeights>;
  tco_assumptions?: {
    vendor_id?: string;
    escalation_rate?: number;
    implementation_fee?: number;
    annual_license_yr1?: number;
    annual_support_yr1?: number;
    user_count?: number;
    contract_years?: number;
  };
  requirement_overrides?: Record<string, string>;
}

// Phase 4 Decision Trace & Decision Pack Interfaces
export interface JustificationPillar {
  key: string;
  title: string;
  detail: string;
  evidence_id?: string;
  evidence_quote?: string;
  evidence_page?: number;
  section_title?: string;
  verified?: boolean;
}

export interface WhyNotCheapest {
  vendor_id: string;
  vendor_name: string;
  nominal_3yr_tco: number;
  failed_requirement: string;
  status: string;
  explanation: string;
  evidence_id?: string;
  evidence_quote?: string;
  evidence_page?: number;
  section_title?: string;
}

export interface CriterionContribution {
  key: string;
  label: string;
  weight: number;
  raw_score: number;
  weighted_contribution: number;
}

export interface VendorContribution {
  vendor_id: string;
  vendor_name: string;
  rank: number;
  total_score: number;
  is_disqualified: boolean;
  disqualification_reason?: string;
  contributions: CriterionContribution[];
}

export interface DecisionTrace {
  evaluation_id: string;
  evaluation_title: string;
  recommended_vendor?: ScoreResult;
  why_vendor_won: JustificationPillar[];
  why_not_cheapest?: WhyNotCheapest;
  score_contributions: VendorContribution[];
  key_risks_summary: any[];
  negotiation_opportunity?: {
    target_vendor: string;
    current_escalator: string;
    target_escalator: string;
    projected_3yr_savings: number;
    action_item: string;
  };
}

export interface DecisionPack {
  evaluation_id: string;
  evaluation_title: string;
  category: string;
  page1_executive_summary: {
    title: string;
    recommended_vendor: string;
    score: number;
    executive_narrative: string;
    pillars: JustificationPillar[];
  };
  page2_vendor_comparison: any[];
  page3_decision_trace: {
    why_vendor_won: JustificationPillar[];
    why_not_cheapest?: WhyNotCheapest;
    score_contributions: VendorContribution[];
  };
  page4_risk_intelligence: any[];
  page5_negotiation_priorities: any[];
  page6_evidence_index: any[];
}


