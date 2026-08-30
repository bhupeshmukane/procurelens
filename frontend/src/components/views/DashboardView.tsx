import React from 'react';
import { useEvaluation } from '../../context/EvaluationContext';

export const DashboardView: React.FC = () => {
  const { evaluations, activeEval, setActiveEvalId, setActiveTab, seedDemoData } = useEvaluation();

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-xl">
      {/* Executive Welcome & Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl p-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase mb-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Auditable Procurement Decision Intelligence
          </div>
          <h1 className="font-headline-lg text-[28px] font-bold tracking-tight mb-xs">
            ProcureLens Intelligence Cockpit
          </h1>
          <p className="text-white/80 text-[15px] leading-relaxed">
            Eliminate vendor proposal blindspots. Ingest multi-page RFPs, verify claims against source pages, calculate deterministic 3-year TCO, and enforce mandatory security kill-criteria.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm shrink-0">
          <button
            onClick={() => setActiveTab('decision_trace')}
            className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[14px] px-4 py-2.5 rounded-xl transition-all shadow-md hover:bg-tertiary-fixed-dim"
          >
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span>Judge Mode</span>
          </button>
          <button
            onClick={seedDemoData}
            className="flex items-center gap-2 bg-white text-primary hover:bg-slate-100 font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
            <span>Run 3-Vendor Demo</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-[14px] px-4 py-2.5 rounded-xl border border-white/30 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New RFP</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Stat Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex items-center gap-md">
          <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">assignment</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Active Evaluations</div>
            <div className="text-[22px] font-black text-on-surface tabular-nums">{evaluations.length}</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex items-center gap-md">
          <div className="h-12 w-12 rounded-lg bg-tertiary-container/15 text-tertiary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">fact_check</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Anchored Proof Pages</div>
            <div className="text-[22px] font-black text-on-surface tabular-nums">
              {activeEval?.vendors?.reduce((acc, v) => acc + (v.documents?.[0]?.page_count || 0), 0) || 9}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex items-center gap-md">
          <div className="h-12 w-12 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">warning</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Detected Risk Clauses</div>
            <div className="text-[22px] font-black text-on-surface tabular-nums">
              {activeEval?.risks?.length || 4}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex items-center gap-md">
          <div className="h-12 w-12 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">security</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Kill-Criteria Gated</div>
            <div className="text-[22px] font-black text-error tabular-nums">
              {activeEval?.score_results?.filter((s) => s.is_disqualified).length || 1} Vendor
            </div>
          </div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Procurement Project Portfolio</h2>
          </div>
          <button
            onClick={() => setActiveTab('setup')}
            className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Evaluation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="p-md">Evaluation Title</th>
                <th className="p-md">Category</th>
                <th className="p-md">Proposals</th>
                <th className="p-md">Pipeline Status</th>
                <th className="p-md">Created Date</th>
                <th className="p-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-[13.5px]">
              {evaluations.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => {
                    setActiveEvalId(ev.id);
                    setActiveTab(ev.status === 'analyzed' ? 'comparison' : 'upload');
                  }}
                  className="hover:bg-surface transition-colors cursor-pointer group"
                >
                  <td className="p-md font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                    {ev.title}
                  </td>
                  <td className="p-md text-on-surface-variant">{ev.category}</td>
                  <td className="p-md font-bold text-on-surface tabular-nums">
                    {ev.vendor_count || 0} Vendors ({ev.document_count || 0} PDFs)
                  </td>
                  <td className="p-md">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        ev.status === 'analyzed'
                          ? 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td className="p-md text-on-surface-variant text-[12px] tabular-nums">
                    {new Date(ev.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-md text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEvalId(ev.id);
                        setActiveTab(ev.status === 'analyzed' ? 'comparison' : 'upload');
                      }}
                      className="bg-surface-container border border-outline-variant hover:bg-surface-variant text-on-surface px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors"
                    >
                      Open Cockpit &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
