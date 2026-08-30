import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { Badge } from '../common/Badge';

export const RiskCenterView: React.FC = () => {
  const { activeEval, openEvidenceDrawer, setActiveTab } = useEvaluation();
  const [selectedVendorId, setSelectedVendorId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!activeEval || !activeEval.risks || activeEval.risks.length === 0) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">security</span>
        <h2 className="font-bold text-[18px] text-on-surface mb-xs">No Red-Team Risks Detected</h2>
        <p className="text-[13px] text-on-surface-variant max-w-md">
          Execute the analytical pipeline to run automated contractual, commercial, SLA, and security red-team discovery.
        </p>
      </div>
    );
  }

  const vendors = activeEval.vendors || [];
  const allRisks = activeEval.risks;

  const filteredRisks = allRisks.filter((r) => {
    const matchesVendor = selectedVendorId === 'ALL' || r.vendor_id === selectedVendorId;
    const matchesCategory = selectedCategory === 'ALL' || (r.category && r.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesVendor && matchesCategory;
  });

  const criticalCount = allRisks.filter((r) => r.severity === 'CRITICAL').length;
  const highCount = allRisks.filter((r) => r.severity === 'HIGH').length;
  const mediumCount = allRisks.filter((r) => r.severity === 'MEDIUM').length;
  const lowCount = allRisks.filter((r) => r.severity === 'LOW').length;

  const categories = [
    'ALL',
    'Commercial / Financial',
    'Contractual / Legal',
    'Security / Compliance',
    'Pricing / TCO',
    'SLA / Support',
    'Data / Privacy',
  ];

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
      {/* Red-Team Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[24px]">gavel</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              Vendor Red-Team Intelligence
            </h1>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Automated discovery of unfavorable contract clauses, hidden escalators, liability limitations, and missing protections.
          </p>
        </div>
      </div>

      {/* Summary Counter Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        <div className="bg-error-container/20 border border-error-container rounded-xl p-md flex items-center gap-md shadow-sm">
          <div className="h-11 w-11 rounded-lg bg-error text-white flex items-center justify-center font-black text-[18px]">
            {criticalCount}
          </div>
          <div>
            <div className="text-[11px] font-bold text-error uppercase tracking-wider">Critical Risks</div>
            <div className="text-[12px] text-on-surface-variant">Mandatory gate violations</div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-md flex items-center gap-md shadow-sm">
          <div className="h-11 w-11 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-[18px]">
            {highCount}
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">High Risks</div>
            <div className="text-[12px] text-on-surface-variant">Financial/legal exposure</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md shadow-sm">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[18px]">
            {mediumCount}
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Medium Risks</div>
            <div className="text-[12px] text-on-surface-variant">SLA & operational terms</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md shadow-sm">
          <div className="h-11 w-11 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center font-black text-[18px]">
            {lowCount}
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Low / Info</div>
            <div className="text-[12px] text-on-surface-variant">Standard clarifications</div>
          </div>
        </div>
      </div>

      {/* Vendor Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-sm">
        <span className="text-[12px] font-bold text-on-surface-variant mr-2">Filter Vendor:</span>
        <button
          onClick={() => setSelectedVendorId('ALL')}
          className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
            selectedVendorId === 'ALL'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container hover:bg-surface-variant text-on-surface'
          }`}
        >
          All Proposals ({allRisks.length})
        </button>
        {vendors.map((v) => {
          const count = allRisks.filter((r) => r.vendor_id === v.id).length;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVendorId(v.id)}
              className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                selectedVendorId === v.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span>{v.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedVendorId === v.id ? 'bg-white/20 text-white' : 'bg-surface text-on-surface-variant'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-2">Category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
              selectedCategory === cat
                ? 'bg-on-surface text-surface border-on-surface'
                : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Red-Team Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-stretch">
        {filteredRisks.map((risk) => {
          const isCrit = risk.severity === 'CRITICAL';
          const isHigh = risk.severity === 'HIGH';
          return (
            <div
              key={risk.id}
              className={`bg-surface-container-lowest border rounded-2xl p-lg flex flex-col justify-between shadow-sm transition-all ${
                isCrit
                  ? 'border-error/40 ring-1 ring-error/20'
                  : isHigh
                  ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'border-outline-variant'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                    <span className="font-bold text-[13px] text-on-surface">{risk.vendor_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {risk.category && (
                      <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10.5px] font-semibold">
                        {risk.category}
                      </span>
                    )}
                    <Badge
                      type={isCrit ? 'critical' : isHigh ? 'high' : 'medium'}
                      text={`${risk.severity} RISK`}
                    />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-headline-md text-[15px] font-bold text-on-surface mb-xs">
                  {risk.title}
                </h3>
                <p className="text-[12.5px] text-on-surface-variant leading-relaxed mb-md">
                  {risk.description}
                </p>

                {/* Impact & Recommended Action Bento */}
                <div className="bg-surface border border-outline-variant/60 rounded-xl p-sm space-y-2 mb-md text-[12px]">
                  {risk.impact && (
                    <div className="text-on-surface">
                      <strong className="text-error font-bold">Business Impact: </strong>
                      {risk.impact}
                    </div>
                  )}
                  {risk.recommended_action && (
                    <div className="text-on-surface border-t border-outline-variant/40 pt-1.5">
                      <strong className="text-primary font-bold">Recommended Action: </strong>
                      {risk.recommended_action}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer with Evidence Attachment */}
              <div className="pt-sm border-t border-outline-variant flex items-center justify-between gap-2">
                {risk.evidence ? (
                  <button
                    onClick={() => risk.evidence && openEvidenceDrawer(risk.evidence)}
                    className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>View Page {risk.evidence.page_number} Quote</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-on-surface-variant">General Analysis</span>
                )}

                <button
                  onClick={() => setActiveTab('negotiation')}
                  className="flex items-center gap-1 bg-surface-container hover:bg-surface-variant text-on-surface text-[11.5px] font-bold px-3 py-1 rounded-lg border border-outline-variant/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">handshake</span>
                  <span>Negotiation Playbook &rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
