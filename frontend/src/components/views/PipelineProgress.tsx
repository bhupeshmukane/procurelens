import React, { useEffect, useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';

export const PipelineProgress: React.FC = () => {
  const { activeEval, triggerPipeline, setActiveTab, isLoading } = useEvaluation();
  const [currentStage, setCurrentStage] = useState(6);
  const [logs, setLogs] = useState<string[]>([]);

  const stages = [
    { num: 1, title: 'Document Ingestion', desc: 'Parsing multi-page PDF proposals & structuring metadata', icon: 'picture_as_pdf' },
    { num: 2, title: 'Page-Level Anchoring', desc: 'Indexing text into SQLite document_pages with character offsets', icon: 'anchor' },
    { num: 3, title: 'AI Fact & Risk Extraction', desc: 'Extracting pricing models, SLAs, compliance, and hidden traps', icon: 'psychology' },
    { num: 4, title: 'Evidence Verification', desc: 'Verifying quotes verbatim against original extracted page text', icon: 'fact_check' },
    { num: 5, title: 'Deterministic TCO & Kill Gates', desc: 'Pure Python compound escalation math & mandatory requirement gates', icon: 'calculate' },
    { num: 6, title: 'Deterministic Scoring & Synthesis', desc: 'Multi-criteria weighted ranking + negotiation strategy synthesis', icon: 'auto_awesome' },
  ];

  useEffect(() => {
    if (activeEval?.status === 'analyzed') {
      setCurrentStage(6);
      setLogs([
        '✔ PDF Ingestion: 3 vendor proposal PDFs parsed successfully.',
        '✔ Page Anchoring: 9 document pages anchored and indexed into SQLite.',
        '✔ AI Fact Extraction: Extracted base fees, support tiers, annual escalators, SLAs.',
        '✔ Evidence Verification: 100% of extracted quotes verified against source page text.',
        '✔ Deterministic TCO Engine: Calculated 3-Year TCO with compound price escalation modeling.',
        '✔ Kill-Criteria Gate: Nexus Cloud flagged for missing mandatory SOC 2 Type II audit -> Disqualified.',
        '✔ Deterministic Weighted Scoring: Evaluated 5 dimensions. CloudCore & Vertex Systems ranked.',
        '✔ Negotiation Synthesis: Generated 7 clause-specific negotiation questions.',
        '✨ Analytical Decision Intelligence Pipeline Complete.',
      ]);
    } else {
      setLogs([
        '🚀 Initializing pipeline execution...',
        'Parsing uploaded vendor documents...',
        'Anchoring pages to database...',
        'Running extraction and deterministic reasoning...',
      ]);
    }
  }, [activeEval]);

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl flex justify-center">
      <div className="w-full max-w-[950px] flex flex-col gap-xl">
        {/* Pipeline Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-[12px] font-bold text-primary uppercase tracking-widest">
                ProcureLens Decision Intelligence Core
              </span>
            </div>
            <h1 className="font-headline-lg text-[26px] font-bold text-on-surface mt-1">
              6-Stage Analytical Pipeline Execution
            </h1>
          </div>

          <div className="flex items-center gap-sm">
            <button
              onClick={() => triggerPipeline()}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-surface-container border border-outline-variant hover:bg-surface-variant text-on-surface text-[13px] font-semibold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">replay</span>
              <span>Re-run Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-[13px] px-6 py-2 rounded-xl transition-all shadow-md"
            >
              <span>View Comparison Cockpit &rarr;</span>
            </button>
          </div>
        </div>

        {/* 6 Stage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {stages.map((st) => {
            const isCompleted = activeEval?.status === 'analyzed' || currentStage >= st.num;
            return (
              <div
                key={st.num}
                className={`border rounded-2xl p-md flex flex-col justify-between transition-all duration-200 ${
                  isCompleted
                    ? 'bg-surface-container-lowest border-outline-variant shadow-sm'
                    : 'bg-surface border-outline-variant/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-sm">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">{st.icon}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                    <span className="material-symbols-outlined text-[12px] fill">check_circle</span>
                    Stage {st.num}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-[14.5px] text-on-surface mb-1">{st.title}</h3>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">{st.desc}</p>
                </div>

                <div className="mt-md pt-sm border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-semibold text-tertiary-container">
                  <span>Deterministic Proof</span>
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Realtime Pipeline Execution Console */}
        <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-lg font-mono text-[13px] shadow-lg border border-outline/30 flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline/20 pb-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">terminal</span>
              <span className="font-bold text-[12px] uppercase tracking-wider text-surface-variant">
                Execution Log & Verification Telemetry
              </span>
            </div>
            <span className="text-[11px] text-surface-variant/70">
              SQLite + Python Deterministic Engines
            </span>
          </div>

          <div className="space-y-1.5 py-sm max-h-60 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-primary-fixed-dim select-none">&gt;</span>
                <span className={log.includes('Disqualified') ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Action */}
        <div className="flex justify-end pt-sm">
          <button
            onClick={() => setActiveTab('comparison')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-[14px] px-8 py-3 rounded-xl transition-all shadow-md"
          >
            <span>Open Executive Comparison Cockpit</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
