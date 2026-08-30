import React from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api } from '../../services/api';

export const TopHeader: React.FC = () => {
  const { activeEval, evaluations, setActiveEvalId, setActiveTab, fetchEvaluations, loadEvaluation, triggerPipeline, isLoading } = useEvaluation();

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo evaluations and clean the database?')) return;
    try {
      await api.resetDemo();
      await fetchEvaluations();
      setActiveEvalId(null);
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await api.seedDemo();
      await fetchEvaluations();
      await loadEvaluation(res.evaluation_id);
      setActiveTab('comparison');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-lg z-40">
      {/* Evaluation Selector & Breadcrumb */}
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-[22px]">assignment</span>
          <select
            value={activeEval?.id || ''}
            onChange={(e) => setActiveEvalId(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-semibold text-[14px] rounded-lg px-sm py-1 focus:ring-2 focus:ring-primary outline-none max-w-xs truncate"
          >
            {evaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.category})
              </option>
            ))}
          </select>
        </div>

        {activeEval && (
          <div className="hidden lg:flex items-center gap-2 text-on-surface-variant text-[13px] border-l border-outline-variant pl-md">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              activeEval.status === 'analyzed'
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {activeEval.status}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-sm">
        <button
          onClick={handleResetDemo}
          disabled={isLoading}
          className="flex items-center gap-1 bg-surface border border-outline-variant/60 text-on-surface-variant hover:text-error hover:bg-error-container/20 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
          title="Reset database to clean state"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Reset</span>
        </button>

        <button
          onClick={handleSeedDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-variant text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          title="Creates a full demo RFP with 3 vendor PDFs and runs the pipeline"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
          <span>Load 3-Vendor Demo</span>
        </button>

        <button
          onClick={() => setActiveTab('decision_trace')}
          className="flex items-center gap-1.5 bg-tertiary/10 border border-tertiary/30 text-tertiary hover:bg-tertiary/20 text-[13px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          title="Open Judge Mode / Decision Trace"
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span>Judge Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New RFP</span>
        </button>

        {activeEval && activeEval.vendors?.length > 0 && activeEval.status !== 'analyzed' && (
          <button
            onClick={triggerPipeline}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>{isLoading ? 'Processing...' : 'Run Pipeline'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
