import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';

export const TCOAnalysisView: React.FC = () => {
  const { activeEval, openEvidenceDrawer } = useEvaluation();
  const [simulatedUsers, setSimulatedUsers] = useState(1000);

  if (!activeEval || !activeEval.tco_results || activeEval.tco_results.length === 0) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant">
        No TCO analysis available yet. Run the analytical pipeline first.
      </div>
    );
  }

  const validTcos = activeEval.tco_results.filter((t) => t.is_complete);
  const minTco = Math.min(...validTcos.map((t) => t.total_3yr_tco));
  const maxTco = Math.max(...validTcos.map((t) => t.total_3yr_tco));
  const tcoSpread = maxTco - minTco;

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
      {/* Header & KPI Bento */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              Deterministic 3-Year Total Cost of Ownership (TCO)
            </h1>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Normalized 36-month cost projections factoring in implementation setup, support tiers, and compound annual price escalators.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Lowest 3-Year TCO</div>
          <div className="text-[24px] font-black text-tertiary-container tabular-nums">
            ${minTco.toLocaleString()}
          </div>
          <div className="text-[11.5px] text-on-surface-variant mt-1">
            Best nominal price before risk & compliance gating
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Highest 3-Year TCO</div>
          <div className="text-[24px] font-black text-on-surface tabular-nums">
            ${maxTco.toLocaleString()}
          </div>
          <div className="text-[11.5px] text-on-surface-variant mt-1">
            Top expenditure among evaluated vendors
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase">3-Year Price Spread Variance</div>
          <div className="text-[24px] font-black text-primary tabular-nums">
            ${tcoSpread.toLocaleString()}
          </div>
          <div className="text-[11.5px] text-on-surface-variant mt-1">
            Potential enterprise savings opportunity
          </div>
        </div>
      </div>

      {/* Detailed TCO Breakdown Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-md bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-headline-md text-[15px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">table_chart</span>
            36-Month Cost Schedule Breakdown
          </h2>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Compound Escalation Modeled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">
              <tr>
                <th className="p-md">Vendor</th>
                <th className="p-md text-right">Implementation</th>
                <th className="p-md text-right">Year 1 Total</th>
                <th className="p-md text-right">Year 2 Total</th>
                <th className="p-md text-right">Year 3 Total</th>
                <th className="p-md text-center">Annual Escalation</th>
                <th className="p-md text-right">3-Year TCO</th>
                <th className="p-md text-right">Per User / Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-[13.5px]">
              {activeEval.tco_results.map((t) => (
                <tr key={t.id} className="hover:bg-surface transition-colors">
                  <td className="p-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                    {t.vendor_name}
                  </td>
                  <td className="p-md text-right font-medium tabular-nums">${t.implementation_fee.toLocaleString()}</td>
                  <td className="p-md text-right font-medium tabular-nums">${t.year1_total.toLocaleString()}</td>
                  <td className="p-md text-right font-medium tabular-nums">${t.year2_total.toLocaleString()}</td>
                  <td className="p-md text-right font-medium tabular-nums">${t.year3_total.toLocaleString()}</td>
                  <td className="p-md text-center font-bold tabular-nums">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      t.escalation_rate > 0.04
                        ? 'bg-error-container text-error font-bold border border-error/30'
                        : 'bg-tertiary-container/10 text-tertiary-container font-semibold'
                    }`}>
                      {(t.escalation_rate * 100).toFixed(1)}% / yr
                    </span>
                  </td>
                  <td className="p-md text-right font-black text-on-surface text-[15px] tabular-nums">
                    ${t.total_3yr_tco.toLocaleString()}
                  </td>
                  <td className="p-md text-right font-semibold text-on-surface-variant tabular-nums">
                    ${t.cost_per_user_year.toFixed(0)}/user
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Risk Analysis Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-[14px] mb-sm">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            How Price Escalation Impacts Multi-Year Budgets
          </div>
          <p className="text-[13px] text-on-surface leading-relaxed">
            In vendor contracts with a <strong>7% annual price escalator</strong> (e.g. Vertex Systems), Year 3 license fees increase by <strong>14.5%</strong> over the initial baseline. Over a 5-year engagement, this compounds to a 31% fee premium over vendors offering fixed rates or CPI-indexed caps.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="flex items-center gap-2 text-tertiary-container font-bold text-[14px] mb-sm">
            <span className="material-symbols-outlined text-[18px]">shield</span>
            Deterministic Cost Integrity Rule
          </div>
          <p className="text-[13px] text-on-surface leading-relaxed">
            ProcureLens strictly calculates TCO in pure Python code. Missing price items are flagged as incomplete and never default to $0, preventing artificial inflation of incomplete vendor bids.
          </p>
        </div>
      </div>
    </div>
  );
};
