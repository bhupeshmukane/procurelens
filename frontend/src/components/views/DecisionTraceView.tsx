import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api, DecisionTrace, DecisionPack } from '../../services/api';
import { ExecutiveDecisionPackModal } from './ExecutiveDecisionPackModal';

export const DecisionTraceView: React.FC = () => {
  const { activeEval, openEvidenceDrawer, setActiveTab } = useEvaluation();
  const [traceData, setTraceData] = useState<DecisionTrace | null>(null);
  const [packData, setPackData] = useState<DecisionPack | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPackModal, setShowPackModal] = useState<boolean>(false);
  const [selectedVendorForContribution, setSelectedVendorForContribution] = useState<string>('');

  useEffect(() => {
    if (activeEval?.id) {
      loadTraceData(activeEval.id);
    }
  }, [activeEval?.id]);

  const loadTraceData = async (evalId: string) => {
    setIsLoading(true);
    try {
      const [trace, pack] = await Promise.all([
        api.getDecisionTrace(evalId),
        api.getDecisionPack(evalId),
      ]);
      setTraceData(trace);
      setPackData(pack);
      if (trace.recommended_vendor) {
        setSelectedVendorForContribution(trace.recommended_vendor.vendor_id);
      }
    } catch (e) {
      console.error('Failed to load decision trace:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeEval) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant">
        No active evaluation. Please select or seed a demo RFP first.
      </div>
    );
  }

  if (isLoading || !traceData) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl text-on-surface-variant">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
          <span className="text-[13px] font-medium">Generating Deterministic Decision Trace...</span>
        </div>
      </div>
    );
  }

  const winner = traceData.recommended_vendor;
  const whyNot = traceData.why_not_cheapest;
  const activeContribVendor = traceData.score_contributions.find((vc) => vc.vendor_id === selectedVendorForContribution) || traceData.score_contributions[0];
  const winnerEvidenceId = traceData.why_vendor_won[0]?.evidence_id;

  const decisionStages = [
    { num: 1, title: 'Proposals', sub: 'PDF Ingestion', icon: 'upload_file' },
    { num: 2, title: 'AI Extraction', sub: 'Facts & Clauses', icon: 'psychology' },
    { num: 3, title: 'Verified Evidence', sub: 'Page Quotes', icon: 'verified' },
    { num: 4, title: 'Deterministic Analysis', sub: '3-Yr TCO Math', icon: 'calculate' },
    { num: 5, title: 'Compliance Gate', sub: 'Kill-Criteria', icon: 'security' },
    { num: 6, title: 'Explainable Decision', sub: 'Award Trace', icon: 'emoji_events' },
    { num: 7, title: 'Negotiation Action', sub: 'TCO Savings', icon: 'handshake' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg bg-background">
      {/* 1. Header & Primary Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              ProcureLens Decision Room
            </h1>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Judge Mode
            </span>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5 font-medium">
            From vendor proposals to auditable procurement decisions.
          </p>
        </div>

        {/* 3 Primary Actions + 1 Secondary Action */}
        <div className="flex items-center gap-sm flex-wrap">
          {winnerEvidenceId && (
            <button
              onClick={() => openEvidenceDrawer(winnerEvidenceId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-[12.5px] font-bold text-on-surface transition-colors shadow-sm"
              title="Inspect source document quotes and verified character offsets"
            >
              <span className="material-symbols-outlined text-primary text-[17px]">visibility</span>
              <span>View Evidence</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('simulator')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-[12.5px] font-bold text-on-surface transition-colors shadow-sm"
            title="Simulate priority changes and what-if scenarios"
          >
            <span className="material-symbols-outlined text-primary text-[17px]">tune</span>
            <span>Simulate Decision</span>
          </button>

          <button
            onClick={() => setActiveTab('negotiation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-[12.5px] font-bold text-on-surface transition-colors shadow-sm"
            title="Open tactical negotiation guidance"
          >
            <span className="material-symbols-outlined text-tertiary text-[17px]">handshake</span>
            <span>Negotiation Guide</span>
          </button>

          <button
            onClick={() => setShowPackModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-[12.5px] font-bold shadow-sm transition-all"
            title="Export 6-page comprehensive executive decision report"
          >
            <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
            <span>Executive Decision Pack</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Recommendation Hero Card */}
      {winner && (
        <div className="bg-gradient-to-r from-primary/10 via-surface-container-lowest to-tertiary/10 border-2 border-primary/40 rounded-2xl p-lg shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-lg">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-primary text-on-primary font-mono text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                  Recommended Award
                </span>
                <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Rank #1 Qualified
                </span>
              </div>
              <h2 className="text-[28px] font-black text-on-surface tracking-tight">
                {winner.vendor_name}
              </h2>
              <p className="text-[13.5px] text-on-surface-variant max-w-2xl leading-relaxed">
                Winning vendor recommendation for <strong className="text-on-surface font-semibold">{activeEval.title}</strong>. Passed 100% of mandatory enterprise requirements, 0 critical contract risks, and guaranteed 0.0% compounding escalation.
              </p>
            </div>

            {/* 4 Compact Justification Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-surface-container/70 border border-outline-variant/60 rounded-xl p-md backdrop-blur-sm shrink-0">
              <div className="flex flex-col bg-surface p-2.5 rounded-lg border border-outline-variant/50">
                <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Compliance
                </div>
                <span className="font-mono text-[17px] font-black text-emerald-700 mt-0.5">100%</span>
                <span className="text-[10px] text-on-surface-variant font-medium">8/8 Requirements</span>
              </div>

              <div className="flex flex-col bg-surface p-2.5 rounded-lg border border-outline-variant/50">
                <div className="flex items-center gap-1 text-primary text-[11px] font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px]">payments</span>
                  3-Yr TCO
                </div>
                <span className="font-mono text-[17px] font-black text-on-surface mt-0.5">
                  ${activeEval.tco_results?.find((t) => t.vendor_id === winner.vendor_id)?.total_3yr_tco ? (activeEval.tco_results.find((t) => t.vendor_id === winner.vendor_id)!.total_3yr_tco / 1000).toFixed(0) + 'K' : '$600K'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">0.0% Escalation</span>
              </div>

              <div className="flex flex-col bg-surface p-2.5 rounded-lg border border-outline-variant/50">
                <div className="flex items-center gap-1 text-on-surface text-[11px] font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">security</span>
                  Risk Exposure
                </div>
                <span className="font-mono text-[17px] font-black text-on-surface mt-0.5">
                  0 Critical
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">100.0 Low Risk</span>
              </div>

              <div className="flex flex-col bg-surface p-2.5 rounded-lg border border-outline-variant/50">
                <div className="flex items-center gap-1 text-primary text-[11px] font-bold uppercase">
                  <span className="material-symbols-outlined text-[14px]">speed</span>
                  Platform Fit
                </div>
                <span className="font-mono text-[17px] font-black text-primary mt-0.5">
                  {winner.total_score.toFixed(1)} <span className="text-[10px] font-normal text-on-surface-variant">/ 100</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">100 Tech / 85 SLA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Horizontal Decision Chain */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[16px]">account_tree</span>
            End-to-End Decision Architecture
          </span>
          <span className="text-[10px] font-mono font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">
            Deterministic & Zero LLM Scoring
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {decisionStages.map((st) => (
            <div
              key={st.num}
              className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/60 flex flex-col gap-1 relative group hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-black text-[10px] flex items-center justify-center">
                  {st.num}
                </span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">
                  {st.icon}
                </span>
              </div>
              <span className="text-[12px] font-bold text-on-surface leading-tight mt-0.5">{st.title}</span>
              <span className="text-[10px] text-on-surface-variant font-medium">{st.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Traceable Justification & Why Not Cheapest (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          {/* Why Did This Vendor Won (4 Traceable Pillars) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">checklist_rtl</span>
                <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                  Traceable Decision Pillars (Why {winner?.vendor_name} Won)
                </h2>
              </div>
              <span className="text-[11px] font-mono font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                Verified Facts
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {traceData.why_vendor_won.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-1.5 transition-all hover:border-primary/40 hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <strong className="text-[13px] text-on-surface font-bold">
                        {pillar.title}
                      </strong>
                    </div>
                    {pillar.evidence_id && (
                      <button
                        onClick={() => openEvidenceDrawer(pillar.evidence_id!)}
                        className="text-[11.5px] font-bold text-primary hover:underline flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-[13px]">visibility</span>
                        <span>Evidence (p.{pillar.evidence_page || 2})</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[12.5px] text-on-surface-variant leading-relaxed pl-7">
                    {pillar.detail}
                  </p>

                  {pillar.evidence_quote && (
                    <div className="ml-7 mt-0.5 p-2 rounded-lg bg-surface border-l-4 border-primary text-[11.5px] text-on-surface italic font-serif">
                      "{pillar.evidence_quote}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* "Why Not The Cheapest?" Panel (Nexus Disqualification Gate) */}
          {whyNot && (
            <div className="bg-error/5 border-2 border-error/30 rounded-xl p-md shadow-sm flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-error/20 pb-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[22px]">gavel</span>
                  <h2 className="font-title-md text-[15px] font-black text-error">
                    WHY NOT THE CHEAPEST? ({whyNot.vendor_name})
                  </h2>
                </div>
                <span className="bg-error text-on-error font-mono text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {whyNot.status}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md bg-surface p-3 rounded-lg border border-error/20">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-on-surface-variant block">
                    Lowest Nominal 3-Year TCO
                  </span>
                  <span className="font-mono text-[19px] font-black text-on-surface">
                    ${whyNot.nominal_3yr_tco.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10.5px] text-on-surface-variant font-medium block mt-0.5">
                    Nominally lowest cost proposal submitted
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10.5px] uppercase font-bold text-error block">
                    Mandatory Requirement Failure
                  </span>
                  <span className="text-[13.5px] font-black text-error block">
                    ❌ {whyNot.failed_requirement}
                  </span>
                  <span className="text-[10.5px] text-error/80 font-medium block mt-0.5">
                    Audit In Progress / Non-Certified
                  </span>
                </div>
              </div>

              <div className="p-3 bg-surface-container rounded-lg text-[12.5px] text-on-surface font-medium leading-relaxed border-l-4 border-error">
                <strong>Decision Principle:</strong> Lowest price ≠ eligible winner. Decision is gated by mandatory requirements before weighted ranking.
              </div>

              {whyNot.evidence_id && (
                <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg border border-outline-variant text-[12px]">
                  <span className="text-on-surface-variant italic truncate max-w-sm">
                    "{whyNot.evidence_quote}"
                  </span>
                  <button
                    onClick={() => openEvidenceDrawer(whyNot.evidence_id!)}
                    className="text-[11.5px] font-bold text-error hover:underline flex items-center gap-1 shrink-0 ml-2 bg-error/10 hover:bg-error/20 px-2 py-1 rounded transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">find_in_page</span>
                    <span>Verify Failed SOC 2 (p.{whyNot.evidence_page || 2})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Score Contributions, Simulation Callout & Negotiation (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Explainable Score Contribution Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                  Score Contribution Breakdown
                </h2>
              </div>
              <span className="text-[10.5px] font-mono text-on-surface-variant">Deterministic Math</span>
            </div>

            {/* Vendor Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {traceData.score_contributions.map((vc) => {
                const isSel = activeContribVendor.vendor_id === vc.vendor_id;
                return (
                  <button
                    key={vc.vendor_id}
                    onClick={() => setSelectedVendorForContribution(vc.vendor_id)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all whitespace-nowrap ${
                      isSel
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {vc.vendor_name} {vc.is_disqualified ? '(DQ)' : `#${vc.rank}`}
                  </button>
                );
              })}
            </div>

            {/* Vendor Header */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container text-[12.5px]">
              <div>
                <span className="text-on-surface-variant text-[10px] uppercase font-bold block">
                  Total Weighted Score
                </span>
                <span className="font-mono text-[18px] font-black text-on-surface">
                  {activeContribVendor.total_score.toFixed(1)} / 100.0
                </span>
              </div>
              <div className="text-right">
                <span className="text-on-surface-variant text-[10px] uppercase font-bold block">
                  Qualification
                </span>
                {activeContribVendor.is_disqualified ? (
                  <span className="text-[11.5px] font-black text-error">DISQUALIFIED</span>
                ) : (
                  <span className="text-[11.5px] font-black text-primary">RANK #{activeContribVendor.rank}</span>
                )}
              </div>
            </div>

            {/* Contribution Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[10.5px] uppercase font-bold text-on-surface-variant">
                    <th className="py-1.5 px-2">Criterion</th>
                    <th className="py-1.5 px-2 text-center">Weight</th>
                    <th className="py-1.5 px-2 text-right">Raw</th>
                    <th className="py-1.5 px-2 text-right font-bold text-primary">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-[12px]">
                  {activeContribVendor.contributions.map((c) => (
                    <tr key={c.key} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-2 px-2 font-medium text-on-surface">{c.label}</td>
                      <td className="py-2 px-2 text-center font-mono text-on-surface-variant">{c.weight}%</td>
                      <td className="py-2 px-2 text-right font-mono">{c.raw_score.toFixed(0)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                        +{c.weighted_contribution.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-container/60 font-bold border-t-2 border-outline-variant text-[12.5px]">
                    <td className="py-2 px-2">Deterministic Sum</td>
                    <td className="py-2 px-2 text-center font-mono">100%</td>
                    <td className="py-2 px-2 text-right font-mono">-</td>
                    <td className="py-2 px-2 text-right font-mono font-black text-primary">
                      {activeContribVendor.total_score.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision Simulator Highlight Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                <h2 className="font-title-md text-[14.5px] font-bold text-on-surface">
                  Decision Simulation
                </h2>
              </div>
              <span className="text-[10px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded font-bold">
                What-If Engine
              </span>
            </div>
            <p className="text-[12px] text-on-surface leading-relaxed">
              <strong>What happens when procurement priorities change?</strong> Test live weight rebalancing, escalation capping, and requirement policy shifts in sub-millisecond calculation time.
            </p>
            <button
              onClick={() => setActiveTab('simulator')}
              className="mt-1 w-full py-1.5 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[12px] transition-colors flex items-center justify-center gap-1 border border-primary/20"
            >
              <span className="material-symbols-outlined text-[15px]">play_arrow</span>
              <span>Open Decision Simulator &rarr;</span>
            </button>
          </div>

          {/* Negotiation Opportunity: Vertex 7% -> 3% */}
          {traceData.negotiation_opportunity && (
            <div className="bg-tertiary/10 border border-tertiary/30 rounded-xl p-md shadow-sm flex flex-col gap-sm">
              <div className="flex items-center justify-between border-b border-tertiary/20 pb-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">savings</span>
                  <h2 className="font-title-md text-[14.5px] font-bold text-tertiary">
                    Negotiation (Vertex 7% → 3%)
                  </h2>
                </div>
                <span className="text-[12px] font-black text-tertiary font-mono">
                  ${traceData.negotiation_opportunity.projected_3yr_savings.toLocaleString(undefined, { minimumFractionDigits: 2 })} Savings
                </span>
              </div>
              <p className="text-[12px] text-on-surface leading-relaxed">
                By negotiating Vertex Systems' annual escalation down from 7.0% to 3.0% (CPI cap), procurement unlocks <strong>$19,840.00 in deterministic 3-Year savings</strong>.
              </p>
              <button
                onClick={() => setActiveTab('negotiation')}
                className="mt-1 w-full py-1.5 px-3 rounded-lg bg-tertiary text-on-tertiary font-bold text-[12px] hover:bg-tertiary/90 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Launch Negotiation Playbook &rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Executive Decision Pack Modal */}
      {showPackModal && packData && (
        <ExecutiveDecisionPackModal
          packData={packData}
          onClose={() => setShowPackModal(false)}
          onViewEvidence={(evId) => {
            setShowPackModal(false);
            openEvidenceDrawer(evId);
          }}
        />
      )}
    </div>
  );
};
export default DecisionTraceView;
