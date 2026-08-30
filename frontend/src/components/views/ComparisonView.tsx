import React from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { WeightSliders } from '../common/WeightSlider';
import { Badge } from '../common/Badge';

export const ComparisonView: React.FC = () => {
  const { activeEval, openEvidenceDrawer, setActiveTab } = useEvaluation();

  if (!activeEval || !activeEval.vendors || activeEval.vendors.length === 0) {
    return (
      <div className="flex-1 p-xl flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">compare_arrows</span>
        <h2 className="font-headline-md text-[18px] font-bold text-on-surface mb-xs">No Evaluation Data Ready</h2>
        <p className="text-[13px] text-on-surface-variant mb-md max-w-md">
          Please upload vendor proposals or click "Load 3-Vendor Demo" in the top bar to run the decision intelligence pipeline.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="bg-primary text-on-primary font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-sm"
        >
          Go to Proposals Upload &rarr;
        </button>
      </div>
    );
  }

  const scoreMap = new Map(activeEval.score_results?.map((s) => [s.vendor_id, s]));
  const tcoMap = new Map(activeEval.tco_results?.map((t) => [t.vendor_id, t]));
  const disqualifiedVendors = activeEval.score_results?.filter((s) => s.is_disqualified) || [];

  // Sort vendors by rank
  const sortedVendors = [...activeEval.vendors].sort((a, b) => {
    const sA = scoreMap.get(a.id)?.rank || 99;
    const sB = scoreMap.get(b.id)?.rank || 99;
    return sA - sB;
  });

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
      {/* Kill-Criteria Alert Banner (if any disqualified) */}
      {disqualifiedVendors.length > 0 && (
        <div className="bg-error-container/30 border border-error-container rounded-2xl p-md flex items-start gap-md shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-error text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">block</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-[15px] text-error">Mandatory Kill-Criteria Disqualification Gate Triggered</h3>
              <Badge type="disqualified" />
            </div>
            <p className="text-[13px] text-on-surface leading-relaxed">
              {disqualifiedVendors.map((d) => (
                <span key={d.vendor_id}>
                  <strong>{d.vendor_name}</strong> failed mandatory requirement: <em>{d.disqualification_reason}</em>.
                  Vendor has been disqualified and moved to bottom rank regardless of pricing.
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Live Weight Sliders for Instant Deterministic Recalculation */}
      <WeightSliders />

      {/* Executive Decision Recommendation Card */}
      {activeEval.recommendation && (
        <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest border border-primary/20 rounded-2xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary fill text-[22px]">verified_user</span>
              <h2 className="font-headline-md text-[17px] font-bold text-on-surface">
                Executive Award Recommendation
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('negotiation')}
              className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Negotiation Strategy</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
          <p className="text-[14px] text-on-surface leading-relaxed font-medium">
            {activeEval.recommendation.executive_summary}
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-stretch">
        {sortedVendors.map((v) => {
          const score = scoreMap.get(v.id);
          const tco = tcoMap.get(v.id);
          const isWinner = score?.rank === 1 && !score?.is_disqualified;
          const isDisqual = score?.is_disqualified;
          const vendorRisks = activeEval.risks?.filter((r) => r.vendor_id === v.id) || [];
          const vendorMatches = activeEval.requirement_matches?.filter((m) => m.vendor_id === v.id) || [];

          return (
            <div
              key={v.id}
              className={`rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-sm ${
                isWinner
                  ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/20'
                  : isDisqual
                  ? 'bg-surface border-error/40 opacity-90'
                  : 'bg-surface-container-lowest border-outline-variant'
              }`}
            >
              {/* Card Header */}
              <div className={`p-lg border-b ${isWinner ? 'bg-primary/5 border-primary/20' : 'border-outline-variant'}`}>
                <div className="flex items-center justify-between mb-sm">
                  <span
                    className={`text-[12px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isWinner
                        ? 'bg-primary text-white'
                        : isDisqual
                        ? 'bg-error text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    Rank #{score?.rank || '-'} {isWinner ? '★ WINNER' : isDisqual ? 'DISQUALIFIED' : ''}
                  </span>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Overall Score</div>
                    <div className="text-[24px] font-black text-primary tabular-nums">
                      {score?.total_score || 0}<span className="text-[14px] text-on-surface-variant">/100</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-headline-lg text-[20px] font-bold text-on-surface truncate">{v.name}</h3>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  {v.documents?.[0]?.filename || 'Proposal Document'} • {v.documents?.[0]?.page_count || 3} pages
                </p>
              </div>

              {/* Subscores Bento */}
              <div className="p-md bg-surface border-b border-outline-variant grid grid-cols-3 gap-2 text-center text-[12px]">
                <div className="bg-white p-2 rounded-lg border border-outline-variant/60">
                  <div className="text-[10px] text-on-surface-variant font-semibold">TCO Score</div>
                  <div className="font-bold text-on-surface tabular-nums text-[14px]">{score?.tco_score}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-outline-variant/60">
                  <div className="text-[10px] text-on-surface-variant font-semibold">Compliance</div>
                  <div className="font-bold text-on-surface tabular-nums text-[14px]">{score?.compliance_score}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-outline-variant/60">
                  <div className="text-[10px] text-on-surface-variant font-semibold">Risk Rating</div>
                  <div className="font-bold text-on-surface tabular-nums text-[14px]">{score?.risk_score}</div>
                </div>
              </div>

              {/* 3-Year TCO Financials */}
              <div className="p-md border-b border-outline-variant flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
                    3-Year Total TCO
                  </span>
                  {tco && !tco.is_complete ? (
                    <Badge type="unverified" text="Incomplete TCO" />
                  ) : (
                    <span className="text-[18px] font-black text-on-surface tabular-nums">
                      ${tco?.total_3yr_tco.toLocaleString() || '0'}
                    </span>
                  )}
                </div>

                <div className="text-[12px] text-on-surface-variant space-y-1 bg-surface p-sm rounded-lg border border-outline-variant/50">
                  <div className="flex justify-between">
                    <span>Implementation Setup:</span>
                    <span className="font-semibold text-on-surface tabular-nums">
                      {tco?.implementation_fee != null ? `$${tco.implementation_fee.toLocaleString()}` : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 1 License + Support:</span>
                    <span className="font-semibold text-on-surface tabular-nums">${tco?.year1_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 2 (Escalated):</span>
                    <span className="font-semibold text-on-surface tabular-nums">${tco?.year2_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 3 (Escalated):</span>
                    <span className="font-semibold text-on-surface tabular-nums">${tco?.year3_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant/40 pt-1">
                    <span>Annual Escalation Clause:</span>
                    <span className={`font-bold tabular-nums ${tco && tco.escalation_rate > 0.04 ? 'text-error' : 'text-emerald-700'}`}>
                      {tco ? (tco.escalation_rate * 100).toFixed(1) : '0'}% / year
                    </span>
                  </div>
                  {tco?.missing_cost_items && tco.missing_cost_items.length > 0 && (
                    <div className="text-[11px] text-error font-semibold pt-1 border-t border-error/20">
                      Missing Inputs: {tco.missing_cost_items.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Compliance Checklist */}
              <div className="p-md border-b border-outline-variant flex flex-col gap-2">
                <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">fact_check</span>
                  Requirements Check
                </span>

                <div className="space-y-1.5">
                  {vendorMatches.map((m) => {
                    const s = (m.status || 'UNKNOWN').toUpperCase();
                    const isPass = s === 'PASS' || s === 'MET';
                    const isFail = s === 'FAIL' || s === 'NOT_MET';
                    const isPartial = s === 'PARTIAL';

                    return (
                      <div
                        key={m.id}
                        onClick={() => m.evidence && openEvidenceDrawer(m.evidence)}
                        className={`p-2 rounded-lg border flex items-center justify-between text-[12px] transition-all ${
                          m.evidence ? 'cursor-pointer hover:border-primary hover:shadow-sm' : ''
                        } ${
                          isPass
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800'
                            : isFail
                            ? 'bg-error-container/20 border-error/30 text-error'
                            : isPartial
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                            : 'bg-surface border-outline-variant/60 text-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`material-symbols-outlined text-[16px] ${
                            isPass ? 'text-emerald-600' : isFail ? 'text-error' : isPartial ? 'text-amber-600' : 'text-on-surface-variant'
                          }`}>
                            {isPass ? 'check_circle' : isFail ? 'cancel' : isPartial ? 'warning' : 'help'}
                          </span>
                          <span className="font-medium truncate">{m.requirement_title}</span>
                        </div>
                        {m.evidence && (
                          <span className="text-[10px] font-bold text-primary underline flex items-center gap-0.5 shrink-0 ml-1">
                            p.{m.evidence.page_number} Proof
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Identified Risk Badges */}
              <div className="p-md flex-1 flex flex-col gap-2">
                <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-amber-600 text-[16px]">warning</span>
                  Detected Procurement Risks ({vendorRisks.length})
                </span>

                <div className="space-y-1.5">
                  {vendorRisks.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => r.evidence && openEvidenceDrawer(r.evidence)}
                      className={`p-2 rounded-lg border flex flex-col gap-1 transition-all ${
                        r.evidence ? 'cursor-pointer hover:border-primary' : ''
                      } ${
                        r.severity === 'CRITICAL'
                          ? 'bg-error-container/30 border-error/40 text-error'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>{r.title}</span>
                        {r.evidence && (
                          <span className="text-[10px] text-primary underline">
                            p.{r.evidence.page_number} Quote
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-on-surface/80 leading-snug">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-md border-t border-outline-variant bg-surface flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveTab('tco')}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant hover:bg-surface text-on-surface text-[12px] font-semibold py-1.5 rounded-lg transition-colors"
                >
                  TCO Breakdown
                </button>
                <button
                  onClick={() => setActiveTab('negotiation')}
                  className="flex-1 bg-primary text-on-primary hover:bg-primary-container text-[12px] font-semibold py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Negotiate
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
