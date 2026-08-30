import React from 'react';
import { useEvaluation, ActiveTab } from '../../context/EvaluationContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeEval } = useEvaluation();

  const navItems: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'comparison', label: 'Vendor Comparison', icon: 'compare_arrows' },
    { id: 'tco', label: '3-Year TCO Analysis', icon: 'analytics' },
    { id: 'compliance', label: 'Compliance Matrix', icon: 'fact_check' },
    { id: 'risks', label: 'Risk Intelligence', icon: 'warning', badge: activeEval?.risks?.length ? `${activeEval.risks.length}` : undefined },
    { id: 'negotiation', label: 'Negotiation Guide', icon: 'handshake' },
    { id: 'simulator', label: 'Decision Simulator', icon: 'tune' },
    { id: 'decision_trace', label: 'Decision Room (Judge)', icon: 'gavel' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-on-surface border-r border-outline-variant flex flex-col py-lg z-50 select-none">
      {/* Brand Header */}
      <div className="px-lg mb-xl">
        <div className="flex items-center gap-sm">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined fill text-2xl">dataset</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-[20px] font-black text-primary-fixed-dim tracking-tight">ProcureLens</h1>
            <p className="font-label-md text-[10px] text-surface-variant/70 uppercase tracking-widest">Decision Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 flex flex-col gap-1 px-sm overflow-y-auto">
        <div className="px-md py-xs text-[11px] font-semibold uppercase tracking-wider text-surface-variant/50">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-md py-sm rounded-lg text-left transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-surface-variant/80 hover:text-surface-bright hover:bg-surface-variant/10'
              }`}
            >
              <div className="flex items-center gap-md">
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-body-md text-[14px]">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-error text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="mt-6 px-md py-xs text-[11px] font-semibold uppercase tracking-wider text-surface-variant/50">
          Evaluation Steps
        </div>
        <button
          onClick={() => setActiveTab('setup')}
          className={`w-full flex items-center gap-md px-md py-sm rounded-lg text-left transition-all ${
            activeTab === 'setup'
              ? 'bg-primary text-on-primary font-semibold shadow-sm'
              : 'text-surface-variant/80 hover:text-surface-bright hover:bg-surface-variant/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span className="font-body-md text-[14px]">1. Requirements Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`w-full flex items-center gap-md px-md py-sm rounded-lg text-left transition-all ${
            activeTab === 'upload'
              ? 'bg-primary text-on-primary font-semibold shadow-sm'
              : 'text-surface-variant/80 hover:text-surface-bright hover:bg-surface-variant/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
          <span className="font-body-md text-[14px]">2. Vendor Proposals</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`w-full flex items-center gap-md px-md py-sm rounded-lg text-left transition-all ${
            activeTab === 'pipeline'
              ? 'bg-primary text-on-primary font-semibold shadow-sm'
              : 'text-surface-variant/80 hover:text-surface-bright hover:bg-surface-variant/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">hub</span>
          <span className="font-body-md text-[14px]">3. AI Extraction Pipeline</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="mt-auto px-lg pt-md border-t border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-variant/60 text-[12px]">
          <span className="h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span>
          <span>Deterministic Engine Active</span>
        </div>
        <div className="text-[11px] text-surface-variant/40">
          TCO • Scoring • Kill Gates: Pure Python
        </div>
      </div>
    </aside>
  );
};
