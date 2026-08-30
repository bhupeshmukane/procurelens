import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, EvaluationDetail, ScoringWeights, Evidence } from '../services/api';

export type ActiveTab = 'dashboard' | 'setup' | 'upload' | 'pipeline' | 'comparison' | 'compliance' | 'tco' | 'risks' | 'negotiation' | 'simulator' | 'decision_trace' | 'decision_pack';

interface EvaluationContextType {
  evaluations: any[];
  activeEvalId: string | null;
  activeEval: EvaluationDetail | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  selectedEvidence: Evidence | null;
  isEvidenceDrawerOpen: boolean;
  scoringWeights: ScoringWeights;
  setActiveTab: (tab: ActiveTab) => void;
  setActiveEvalId: (id: string | null) => void;
  fetchEvaluations: () => Promise<void>;
  loadEvaluation: (id: string) => Promise<void>;
  openEvidenceDrawer: (evidence: Evidence | string) => void | Promise<void>;
  closeEvidenceDrawer: () => void;
  updateWeights: (newWeights: ScoringWeights) => Promise<void>;
  triggerPipeline: () => Promise<void>;
  seedDemoData: () => Promise<void>;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [activeEvalId, setActiveEvalId] = useState<string | null>(null);
  const [activeEval, setActiveEval] = useState<EvaluationDetail | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState<boolean>(false);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>({
    weight_tco: 35,
    weight_technical: 25,
    weight_compliance: 20,
    weight_risk: 10,
    weight_sla: 10,
  });

  const fetchEvaluations = async () => {
    try {
      const list = await api.getEvaluations();
      setEvaluations(list);
      if (list.length > 0 && !activeEvalId) {
        setActiveEvalId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch evaluations:', e);
    }
  };

  const loadEvaluation = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getEvaluation(id);
      setActiveEval(data);
      setActiveEvalId(id);
      if (data.weights) {
        setScoringWeights({
          weight_tco: data.weights.weight_tco,
          weight_technical: data.weights.weight_technical,
          weight_compliance: data.weights.weight_compliance,
          weight_risk: data.weights.weight_risk,
          weight_sla: data.weights.weight_sla,
        });
      }
    } catch (e) {
      console.error('Failed to load evaluation:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    if (activeEvalId) {
      loadEvaluation(activeEvalId);
    }
  }, [activeEvalId]);

  const openEvidenceDrawer = async (evidence: Evidence | string) => {
    if (typeof evidence === 'string') {
      try {
        const ev = await api.getEvidence(evidence);
        setSelectedEvidence(ev);
        setIsEvidenceDrawerOpen(true);
      } catch (err) {
        console.error('Failed to load evidence by ID:', err);
      }
    } else {
      setSelectedEvidence(evidence);
      setIsEvidenceDrawerOpen(true);
    }
  };

  const closeEvidenceDrawer = () => {
    setIsEvidenceDrawerOpen(false);
  };

  const updateWeights = async (newWeights: ScoringWeights) => {
    setScoringWeights(newWeights);
    if (!activeEvalId || !activeEval) return;

    try {
      // Deterministic instant recalculation (<5ms)
      const res = await api.rebalanceWeights(activeEvalId, newWeights);
      if (res.score_results) {
        setActiveEval((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            weights: { ...prev.weights, ...newWeights } as any,
            score_results: res.score_results,
          };
        });
      }
    } catch (e) {
      console.error('Failed to rebalance weights:', e);
    }
  };

  const triggerPipeline = async () => {
    if (!activeEvalId) return;
    setIsLoading(true);
    try {
      await api.runPipeline(activeEvalId);
      await loadEvaluation(activeEvalId);
      setActiveTab('comparison');
    } catch (e) {
      console.error('Pipeline failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDemoData = async () => {
    setIsLoading(true);
    try {
      // Create new evaluation
      const createRes = await api.createEvaluation({
        title: 'Enterprise Cloud Analytics RFP',
        category: 'Cloud Infrastructure & AI',
        description: 'Comprehensive 3-Year Enterprise Procurement RFP Evaluation for 1,000 Global Users.',
      });
      const newId = createRes.id;
      // Seed 3 vendor proposals
      await api.seedSampleDocuments(newId);
      // Run analysis
      await api.runPipeline(newId);
      await fetchEvaluations();
      await loadEvaluation(newId);
      setActiveTab('comparison');
    } catch (e) {
      console.error('Failed to seed demo data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EvaluationContext.Provider
      value={{
        evaluations,
        activeEvalId,
        activeEval,
        activeTab,
        isLoading,
        selectedEvidence,
        isEvidenceDrawerOpen,
        scoringWeights,
        setActiveTab,
        setActiveEvalId,
        fetchEvaluations,
        loadEvaluation,
        openEvidenceDrawer,
        closeEvidenceDrawer,
        updateWeights,
        triggerPipeline,
        seedDemoData,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};
