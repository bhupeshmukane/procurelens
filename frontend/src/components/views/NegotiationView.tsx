import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api, NegotiationItem, NegotiationBrief } from '../../services/api';
import { Badge } from '../common/Badge';

export const NegotiationView: React.FC = () => {
  const { activeEval, openEvidenceDrawer } = useEvaluation();
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [vendorItems, setVendorItems] = useState<NegotiationItem[]>([]);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [brief, setBrief] = useState<NegotiationBrief | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  const vendors = activeEval?.vendors || [];

  useEffect(() => {
    if (vendors.length > 0 && !selectedVendorId) {
      // Default to Vertex Systems if present (has prime negotiation clauses) or first vendor
      const vertex = vendors.find((v) => v.name.toLowerCase().includes('vertex'));
      setSelectedVendorId(vertex ? vertex.id : vendors[0].id);
    }
  }, [vendors, selectedVendorId]);

  useEffect(() => {
    if (!selectedVendorId || !activeEval) return;
    const items = (activeEval.negotiation_items || []).filter((i) => i.vendor_id === selectedVendorId);
    setVendorItems(items);
  }, [selectedVendorId, activeEval]);

  if (!activeEval || vendors.length === 0) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">handshake</span>
        <h2 className="font-bold text-[18px] text-on-surface mb-xs">No Negotiation Intelligence Available</h2>
        <p className="text-[13px] text-on-surface-variant max-w-md">
          Run the analytical pipeline to extract vendor contractual clauses and generate AI negotiation targets.
        </p>
      </div>
    );
  }

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const handleGenerateBrief = async () => {
    if (!selectedVendorId) return;
    setLoadingBrief(true);
    try {
      const res = await api.getNegotiationBrief(selectedVendorId);
      setBrief(res);
      setIsBriefModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">handshake</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              Negotiation Intelligence & Playbooks
            </h1>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Turn red-team risks, pricing escalators, and contractual exposures into actionable procurement bargaining leverage.
          </p>
        </div>

        <button
          onClick={handleGenerateBrief}
          disabled={loadingBrief}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          <span>{loadingBrief ? 'Synthesizing Brief...' : 'Generate Negotiation Brief'}</span>
        </button>
      </div>

      {/* Vendor Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-sm">
        <span className="text-[12px] font-bold text-on-surface-variant mr-2">Target Vendor:</span>
        {vendors.map((v) => {
          const isSelected = v.id === selectedVendorId;
          const itemCount = (activeEval.negotiation_items || []).filter((i) => i.vendor_id === v.id).length;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVendorId(v.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container-lowest border border-outline-variant hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span>{v.name}</span>
              <span className={`text-[10.5px] px-2 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-surface text-on-surface-variant'
              }`}>
                {itemCount} points
              </span>
            </button>
          );
        })}
      </div>

      {/* Vendor Negotiation Playbook Cards */}
      {vendorItems.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] text-emerald-600 mb-2">verified</span>
          <h3 className="font-bold text-[16px] text-on-surface">Clean Commercial Terms</h3>
          <p className="text-[13px] text-on-surface-variant max-w-md mx-auto mt-1">
            {selectedVendor?.name} presents standard, low-risk contract terms with 0% price escalators and compliant liability coverage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-lg">
          {vendorItems.map((item, idx) => {
            const isHigh = item.priority === 'HIGH';
            return (
              <div
                key={item.id || idx}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg flex flex-col gap-md shadow-sm transition-all hover:border-primary/40"
              >
                {/* Clause Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${isHigh ? 'bg-error' : 'bg-amber-500'}`} />
                    <h3 className="font-headline-md text-[16px] font-bold text-on-surface">
                      {item.issue}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge type={isHigh ? 'high' : 'medium'} text={`${item.priority} LEVERAGE`} />
                  </div>
                </div>

                {/* 3-Position Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {/* Current Position */}
                  <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col justify-between">
                    <div>
                      <div className="text-[10.5px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">article</span>
                        Current Proposal Position
                      </div>
                      <div className="text-[13px] font-semibold text-on-surface leading-snug">
                        {item.current_position}
                      </div>
                    </div>
                    {item.vendor_rationale && (
                      <div className="text-[11px] text-on-surface-variant/80 mt-2 border-t border-outline-variant/40 pt-1">
                        <em>Vendor Rationale:</em> {item.vendor_rationale}
                      </div>
                    )}
                  </div>

                  {/* AI Recommended Target */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-md flex flex-col justify-between">
                    <div>
                      <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">stars</span>
                        AI Recommended Target
                      </div>
                      <div className="text-[13.5px] font-bold text-emerald-900 leading-snug">
                        {item.target_position}
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-800/80 mt-2 border-t border-emerald-500/20 pt-1 font-medium">
                      🎯 Primary Opening Position
                    </div>
                  </div>

                  {/* AI Recommended Fallback */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-md flex flex-col justify-between">
                    <div>
                      <div className="text-[10.5px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                        AI Recommended Fallback
                      </div>
                      <div className="text-[13.5px] font-bold text-primary-container leading-snug">
                        {item.fallback_position}
                      </div>
                    </div>
                    <div className="text-[11px] text-primary/80 mt-2 border-t border-primary/20 pt-1 font-medium">
                      🛡️ Acceptable Compromise
                    </div>
                  </div>
                </div>

                {/* Buyer Rationale & Evidence Attachment */}
                <div className="bg-surface-container-low rounded-xl p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md text-[12px]">
                  <div className="flex-1">
                    <strong className="text-on-surface font-bold">Strategic Value: </strong>
                    <span className="text-on-surface-variant">{item.buyer_rationale}</span>
                  </div>

                  {item.evidence && (
                    <button
                      onClick={() => item.evidence && openEvidenceDrawer(item.evidence)}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px]">fact_check</span>
                      <span>View Page {item.evidence.page_number} Source Clause</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generated Negotiation Brief Modal */}
      {isBriefModalOpen && brief && (
        <>
          <div
            onClick={() => setIsBriefModalOpen(false)}
            className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-50 transition-opacity"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-3xl w-full p-xl flex flex-col gap-lg max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-outline-variant pb-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">description</span>
                    <h2 className="font-headline-md text-[18px] font-bold text-on-surface">
                      Negotiation Brief: {brief.vendor_name}
                    </h2>
                  </div>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">
                    Executive summary and strategic playbook for procurement procurement contracting.
                  </p>
                </div>
                <button
                  onClick={() => setIsBriefModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Executive Strategy */}
              <div className="bg-surface border border-outline-variant rounded-xl p-md space-y-1.5">
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider">Executive Positioning</div>
                <p className="text-[13px] text-on-surface leading-relaxed">{brief.executive_position}</p>
                <div className="text-[12px] font-semibold text-emerald-700 pt-1">
                  💰 {brief.expected_financial_impact}
                </div>
              </div>

              {/* Priorities Table */}
              <div>
                <h3 className="font-bold text-[14px] text-on-surface mb-sm">Top Negotiation Action Items</h3>
                <div className="border border-outline-variant rounded-xl overflow-hidden text-[12.5px]">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase">
                      <tr>
                        <th className="p-3">Issue / Clause</th>
                        <th className="p-3">Current Vendor Term</th>
                        <th className="p-3">Target Position</th>
                        <th className="p-3">Fallback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {brief.top_priorities.map((tp, idx) => (
                        <tr key={idx} className="hover:bg-surface">
                          <td className="p-3 font-bold text-on-surface">{tp.issue}</td>
                          <td className="p-3 text-error font-medium">{tp.current_position}</td>
                          <td className="p-3 text-emerald-800 font-bold">{tp.target_position}</td>
                          <td className="p-3 text-primary font-medium">{tp.fallback_position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tactical Questions */}
              <div>
                <h3 className="font-bold text-[14px] text-on-surface mb-sm">Strategic Questions to Ask Vendor</h3>
                <div className="space-y-2">
                  {brief.recommended_questions.map((q, idx) => (
                    <div key={idx} className="bg-surface-container-low p-3 rounded-lg text-[12.5px] text-on-surface flex items-start gap-2">
                      <span className="font-bold text-primary">{idx + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-outline-variant pt-md">
                <button
                  onClick={() => setIsBriefModalOpen(false)}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-[13px] font-bold hover:bg-primary-container shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
