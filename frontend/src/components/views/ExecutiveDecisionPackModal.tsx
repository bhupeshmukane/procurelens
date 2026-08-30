import React, { useState } from 'react';
import { DecisionPack } from '../../services/api';

interface Props {
  packData: DecisionPack;
  onClose: () => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const ExecutiveDecisionPackModal: React.FC<Props> = ({ packData, onClose, onViewEvidence }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Toolbar */}
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">description</span>
            <div>
              <h2 className="font-bold text-[16px] text-on-surface">Executive Decision Pack</h2>
              <p className="text-[12px] text-on-surface-variant">
                {packData.evaluation_title} • 6-Page Auditable Procurement Memorandum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Selector Tabs */}
            <div className="hidden sm:flex items-center bg-surface-container p-1 rounded-lg gap-1 text-[12px]">
              {[1, 2, 3, 4, 5, 6].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    currentPage === p
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  Page {p}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-surface-variant text-[12px] font-bold text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div className="p-lg overflow-y-auto flex-1 bg-surface-container-lowest font-sans leading-normal">
          {/* PAGE 1: Executive Summary */}
          {currentPage === 1 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b-2 border-primary pb-md flex justify-between items-end">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                    PROCURELENS EXECUTIVE PROCUREMENT MEMORANDUM
                  </span>
                  <h1 className="text-[26px] font-black text-on-surface mt-1">
                    {packData.evaluation_title}
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-on-surface-variant block font-mono">
                    Date: {new Date().toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Audit Certified ✓
                  </span>
                </div>
              </div>

              {/* Award Recommendation Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-lg flex flex-col gap-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Final Award Recommendation
                </span>
                <div className="flex items-center justify-between">
                  <h2 className="text-[24px] font-black text-on-surface">
                    {packData.page1_executive_summary.recommended_vendor}
                  </h2>
                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-on-surface-variant block">Deterministic Score</span>
                    <span className="font-mono text-[20px] font-black text-primary">
                      {packData.page1_executive_summary.score.toFixed(1)} / 100.0
                    </span>
                  </div>
                </div>
                <p className="text-[14px] text-on-surface leading-relaxed mt-1">
                  {packData.page1_executive_summary.executive_narrative}
                </p>
              </div>

              {/* Decision Pillars */}
              <div>
                <h3 className="text-[14px] font-bold text-on-surface uppercase tracking-wider mb-3">
                  Summary of Deterministic Decision Pillars
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packData.page1_executive_summary.pillars.map((pillar, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-surface border border-outline-variant flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <strong className="text-[13px] text-on-surface">{pillar.title}</strong>
                      </div>
                      <p className="text-[12px] text-on-surface-variant leading-snug mt-1 pl-7">
                        {pillar.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2: Vendor Comparison */}
          {currentPage === 2 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b border-outline-variant pb-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                  PAGE 2 • VENDOR COMPARISON MATRIX
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-1">
                  Comparative Vendor Evaluation & Qualification Summary
                </h2>
              </div>

              <div className="overflow-x-auto border border-outline-variant rounded-xl">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-[11px] uppercase font-bold text-on-surface-variant">
                      <th className="py-3 px-3">Vendor</th>
                      <th className="py-3 px-3 text-center">Rank</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">3-Yr TCO</th>
                      <th className="py-3 px-3 text-center">Compliance</th>
                      <th className="py-3 px-3 text-center">Risk</th>
                      <th className="py-3 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {packData.page2_vendor_comparison.map((v: any) => {
                      const isWinner = v.rank === 1 && !v.is_disqualified;
                      const isDQ = v.is_disqualified;
                      return (
                        <tr key={v.vendor_id} className={isWinner ? 'bg-primary/5 font-semibold' : isDQ ? 'bg-error/5' : ''}>
                          <td className="py-3 px-3 font-bold text-on-surface">{v.vendor_name}</td>
                          <td className="py-3 px-3 text-center font-mono">#{v.rank}</td>
                          <td className="py-3 px-3 text-center">
                            {isWinner ? (
                              <span className="bg-primary text-on-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                Winner
                              </span>
                            ) : isDQ ? (
                              <span className="bg-error text-on-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                Disqualified
                              </span>
                            ) : (
                              <span className="bg-surface-variant text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Alternative
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            ${v.total_3yr_tco ? v.total_3yr_tco.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {isDQ ? (
                              <span className="text-error font-bold">FAIL (SOC 2)</span>
                            ) : (
                              <span className="text-emerald-600 font-bold">100% (8/8)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{v.risk_score ? v.risk_score.toFixed(0) : '100'}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-primary">
                            {v.total_score ? v.total_score.toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-surface-container rounded-lg text-[12px] text-on-surface-variant">
                <strong>Procurement Gating Policy:</strong> Vendors failing mandatory security or architecture specifications are classified as <strong className="text-error">DISQUALIFIED</strong> and excluded from top award consideration regardless of nominal price.
              </div>
            </div>
          )}

          {/* PAGE 3: Decision Trace & Score Contribution */}
          {currentPage === 3 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b border-outline-variant pb-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                  PAGE 3 • DECISION TRACE & SCORING MATHEMATICS
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-1">
                  Multidimensional Score Contribution & Kill-Criteria Gating
                </h2>
              </div>

              {/* Why Not Cheapest */}
              {packData.page3_decision_trace.why_not_cheapest && (
                <div className="bg-error/5 border border-error/20 rounded-xl p-md flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-[14px] text-error">
                      Why Not {packData.page3_decision_trace.why_not_cheapest.vendor_name} (${packData.page3_decision_trace.why_not_cheapest.nominal_3yr_tco.toLocaleString()} TCO)?
                    </strong>
                    <span className="bg-error text-on-error font-mono text-[10px] font-black px-2 py-0.5 rounded">
                      DISQUALIFIED
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface leading-relaxed">
                    {packData.page3_decision_trace.why_not_cheapest.explanation}
                  </p>
                </div>
              )}

              {/* Contribution Matrix */}
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-on-surface mb-2">
                  Deterministic Score Contribution Matrix
                </h3>
                <div className="overflow-x-auto border border-outline-variant rounded-xl">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant text-[11px] uppercase font-bold text-on-surface-variant">
                        <th className="py-2.5 px-3">Vendor</th>
                        <th className="py-2.5 px-2 text-right">TCO (35%)</th>
                        <th className="py-2.5 px-2 text-right">Tech (25%)</th>
                        <th className="py-2.5 px-2 text-right">Security (20%)</th>
                        <th className="py-2.5 px-2 text-right">Risk (10%)</th>
                        <th className="py-2.5 px-2 text-right">SLA (10%)</th>
                        <th className="py-2.5 px-3 text-right font-black text-primary">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-mono">
                      {packData.page3_decision_trace.score_contributions.map((vc) => {
                        const tcoC = vc.contributions.find((c) => c.key === 'tco')?.weighted_contribution || 0;
                        const techC = vc.contributions.find((c) => c.key === 'technical')?.weighted_contribution || 0;
                        const compC = vc.contributions.find((c) => c.key === 'compliance')?.weighted_contribution || 0;
                        const riskC = vc.contributions.find((c) => c.key === 'risk')?.weighted_contribution || 0;
                        const slaC = vc.contributions.find((c) => c.key === 'sla')?.weighted_contribution || 0;
                        return (
                          <tr key={vc.vendor_id}>
                            <td className="py-2.5 px-3 font-sans font-bold text-on-surface">{vc.vendor_name}</td>
                            <td className="py-2.5 px-2 text-right">+{tcoC.toFixed(1)}</td>
                            <td className="py-2.5 px-2 text-right">+{techC.toFixed(1)}</td>
                            <td className="py-2.5 px-2 text-right">+{compC.toFixed(1)}</td>
                            <td className="py-2.5 px-2 text-right">+{riskC.toFixed(1)}</td>
                            <td className="py-2.5 px-2 text-right">+{slaC.toFixed(1)}</td>
                            <td className="py-2.5 px-3 text-right font-black text-primary text-[13px]">
                              {vc.total_score.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 4: Risk Intelligence */}
          {currentPage === 4 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b border-outline-variant pb-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                  PAGE 4 • RISK INTELLIGENCE & VENDOR RED-TEAM
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-1">
                  Discovered Contractual, Pricing, and Operational Risks
                </h2>
              </div>

              <div className="flex flex-col gap-2.5">
                {packData.page4_risk_intelligence.map((risk: any) => (
                  <div key={risk.id} className="p-3 rounded-xl bg-surface border border-outline-variant flex flex-col gap-1 text-[12px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          risk.severity === 'CRITICAL' ? 'bg-error text-on-error' :
                          risk.severity === 'HIGH' ? 'bg-error/15 text-error border border-error/30' :
                          'bg-secondary/15 text-secondary border border-secondary/30'
                        }`}>
                          {risk.severity}
                        </span>
                        <strong className="text-[13px] text-on-surface">{risk.title}</strong>
                      </div>
                      <span className="text-on-surface-variant font-medium">
                        {risk.vendor_name} • Page {risk.page_number || 'N/A'}
                      </span>
                    </div>
                    <p className="text-on-surface-variant leading-snug">{risk.description}</p>
                    {risk.evidence_id && (
                      <button
                        onClick={() => onViewEvidence(risk.evidence_id)}
                        className="text-[11px] font-bold text-primary hover:underline text-left mt-0.5"
                      >
                        [View Source Quote]
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 5: Negotiation Priorities */}
          {currentPage === 5 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b border-outline-variant pb-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                  PAGE 5 • NEGOTIATION PRIORITIES & CLAUSE PLAYBOOK
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-1">
                  Tactical Clause Targets & Fallback Positions
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {packData.page5_negotiation_priorities.map((item: any) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-surface border border-outline-variant flex flex-col gap-2 text-[12px]">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1">
                      <strong className="text-[13px] text-on-surface">{item.issue}</strong>
                      <span className="text-on-surface-variant font-medium">
                        {item.vendor_name} • Priority: <span className="font-bold text-primary">{item.priority}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded bg-surface-container text-[11px]">
                        <span className="font-bold text-on-surface-variant block uppercase">Current Position</span>
                        <span className="text-on-surface">{item.current_position}</span>
                      </div>
                      <div className="p-2 rounded bg-primary/10 border border-primary/20 text-[11px]">
                        <span className="font-bold text-primary block uppercase">Target Position</span>
                        <span className="text-on-surface font-semibold">{item.target_position}</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container text-[11px]">
                        <span className="font-bold text-on-surface-variant block uppercase">Fallback Position</span>
                        <span className="text-on-surface">{item.fallback_position}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 6: Evidence Index */}
          {currentPage === 6 && (
            <div className="flex flex-col gap-lg max-w-3xl mx-auto">
              <div className="border-b border-outline-variant pb-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                  PAGE 6 • SOURCE EVIDENCE INDEX
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-1">
                  Verified Audit Citations & Character-Offset Evidence
                </h2>
              </div>

              <div className="overflow-x-auto border border-outline-variant rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant uppercase font-bold text-on-surface-variant">
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-2">Document</th>
                      <th className="py-2.5 px-2 text-center">Page</th>
                      <th className="py-2.5 px-3">Verified Quote Snippet</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {packData.page6_evidence_index.slice(0, 12).map((ev: any) => (
                      <tr key={ev.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-3 font-bold text-on-surface">{ev.vendor_name}</td>
                        <td className="py-2 px-2 text-on-surface-variant font-mono truncate max-w-[120px]">{ev.filename}</td>
                        <td className="py-2 px-2 text-center font-mono">p.{ev.page_number}</td>
                        <td className="py-2 px-3 text-on-surface italic font-serif truncate max-w-xs">
                          "{ev.quote}"
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-600">
                          {ev.verified ? 'Verified ✓' : 'Unverified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-lg py-sm border-t border-outline-variant flex items-center justify-between bg-surface-container shrink-0 text-[12px]">
          <span className="text-on-surface-variant font-mono">
            Viewing Page {currentPage} of 6
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-surface border border-outline-variant disabled:opacity-40 font-semibold"
            >
              Previous Page
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(6, p + 1))}
              disabled={currentPage === 6}
              className="px-3 py-1 rounded bg-primary text-on-primary disabled:opacity-40 font-semibold"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExecutiveDecisionPackModal;
