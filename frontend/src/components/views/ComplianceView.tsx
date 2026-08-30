import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api, Requirement } from '../../services/api';
import { Badge } from '../common/Badge';

export const ComplianceView: React.FC = () => {
  const { activeEval, openEvidenceDrawer, loadEvaluation } = useEvaluation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReq, setNewReq] = useState<Requirement>({
    category: 'Security',
    title: '',
    description: '',
    priority: 'MUST_HAVE',
    is_mandatory: true,
    weight: 15,
    evaluation_type: 'BOOLEAN',
  });
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  if (!activeEval || !activeEval.requirements || activeEval.requirements.length === 0) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-md">fact_check</span>
        <h2 className="font-bold text-[18px] text-on-surface mb-xs">No Requirements Configured</h2>
        <p className="text-[13px] text-on-surface-variant max-w-md">
          Configure procurement specifications or seed the standard demonstration scenario to evaluate vendor compliance.
        </p>
      </div>
    );
  }

  const vendors = activeEval.vendors || [];
  const requirements = activeEval.requirements || [];
  const matches = activeEval.requirement_matches || [];

  const filteredRequirements = requirements.filter((r) => {
    if (filterPriority === 'ALL') return true;
    return r.priority === filterPriority;
  });

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.title || !activeEval) return;
    try {
      await api.addRequirement(activeEval.id, {
        ...newReq,
        is_mandatory: newReq.priority === 'MUST_HAVE',
      });
      await loadEvaluation(activeEval.id);
      setIsAddModalOpen(false);
      setNewReq({
        category: 'Security',
        title: '',
        description: '',
        priority: 'MUST_HAVE',
        is_mandatory: true,
        weight: 15,
        evaluation_type: 'BOOLEAN',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequirement = async (reqId?: string) => {
    if (!reqId || !activeEval) return;
    if (!window.confirm('Delete this requirement from evaluation?')) return;
    try {
      await api.deleteRequirement(reqId);
      await loadEvaluation(activeEval.id);
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatusCell = (status: string, reason?: string, evidence?: any) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    const isPass = s === 'PASS' || s === 'MET';
    const isFail = s === 'FAIL' || s === 'NOT_MET';
    const isPartial = s === 'PARTIAL';
    const isUnknown = s === 'UNKNOWN' || s === 'NOT_APPLICABLE';

    return (
      <div
        onClick={() => evidence && openEvidenceDrawer(evidence)}
        className={`inline-flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
          evidence ? 'cursor-pointer hover:border-primary hover:shadow-sm' : ''
        } ${
          isPass
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
            : isFail
            ? 'bg-error-container/30 border-error/40 text-error'
            : isPartial
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-800'
            : 'bg-surface border-outline-variant/60 text-on-surface-variant'
        }`}
      >
        <div className="flex items-center gap-1 font-bold text-[12px]">
          <span className="material-symbols-outlined text-[16px]">
            {isPass ? 'check_circle' : isFail ? 'cancel' : isPartial ? 'warning' : 'help'}
          </span>
          <span>{isPass ? 'PASS' : isFail ? 'FAIL' : isPartial ? 'PARTIAL' : 'UNKNOWN'}</span>
        </div>
        {evidence ? (
          <span className="text-[10px] text-primary underline font-semibold mt-0.5">
            Page {evidence.page_number} Quote
          </span>
        ) : (
          <span className="text-[10px] text-on-surface-variant/70 mt-0.5">
            {isUnknown ? 'Clarification Req.' : 'General'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">fact_check</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              Requirement & Compliance Matrix
            </h1>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Define mandatory specifications, evaluate vendor claims with anchored quotes, and enforce kill-criteria gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary-container text-[13px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Requirement</span>
          </button>
        </div>
      </div>

      {/* Priority Filter & Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Priority:</span>
          {['ALL', 'MUST_HAVE', 'SHOULD_HAVE', 'NICE_TO_HAVE'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                filterPriority === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11.5px] text-on-surface-variant font-medium">
          <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> PASS</span>
          <span className="flex items-center gap-1"><span className="text-error font-bold">❌</span> FAIL (Kill Gate)</span>
          <span className="flex items-center gap-1"><span className="text-amber-600 font-bold">⚠</span> PARTIAL</span>
          <span className="flex items-center gap-1"><span className="text-slate-500 font-bold">?</span> UNKNOWN (Clarify)</span>
        </div>
      </div>

      {/* Compliance Matrix Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant text-[11.5px] font-bold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="p-md w-2/5">Requirement Specification</th>
                <th className="p-md">Priority</th>
                <th className="p-md text-center">Weight</th>
                {vendors.map((v) => (
                  <th key={v.id} className="p-md text-center font-bold text-on-surface">
                    <div className="flex flex-col items-center">
                      <span>{v.name}</span>
                      <span className="text-[10px] font-normal text-on-surface-variant">Proposal.pdf</span>
                    </div>
                  </th>
                ))}
                <th className="p-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-[13px]">
              {filteredRequirements.map((req) => (
                <tr key={req.id || req.title} className="hover:bg-surface transition-colors">
                  <td className="p-md">
                    <div className="font-bold text-on-surface text-[13.5px]">{req.title || req.name}</div>
                    <div className="text-[11.5px] text-on-surface-variant mt-0.5">{req.description}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="bg-surface-container px-2 py-0.2 rounded text-[10px] font-bold text-on-surface-variant">
                        {req.category}
                      </span>
                      <span className="text-[10.5px] text-on-surface-variant">Type: {req.evaluation_type || 'BOOLEAN'}</span>
                    </div>
                  </td>

                  <td className="p-md">
                    {req.priority === 'MUST_HAVE' || req.is_mandatory ? (
                      <span className="inline-flex items-center gap-1 bg-error/10 text-error border border-error/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">security</span>
                        MUST HAVE
                      </span>
                    ) : req.priority === 'SHOULD_HAVE' ? (
                      <span className="bg-blue-500/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10.5px] font-bold">
                        SHOULD HAVE
                      </span>
                    ) : (
                      <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10.5px]">
                        NICE TO HAVE
                      </span>
                    )}
                  </td>

                  <td className="p-md text-center font-bold tabular-nums text-on-surface">
                    {req.weight || 10} pts
                  </td>

                  {vendors.map((v) => {
                    const match = matches.find(
                      (m) => m.requirement_id === req.id && m.vendor_id === v.id
                    );
                    return (
                      <td key={v.id} className="p-md text-center">
                        {match ? renderStatusCell(match.status, match.failure_reason, match.evidence) : '—'}
                      </td>
                    );
                  })}

                  <td className="p-md text-right">
                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="text-on-surface-variant hover:text-error p-1 rounded transition-colors"
                      title="Delete requirement"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Requirement Modal */}
      {isAddModalOpen && (
        <>
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-on-background/30 backdrop-blur-sm z-50 transition-opacity"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full p-lg flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
                <h3 className="font-bold text-[17px] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_task</span>
                  Add Procurement Requirement
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddRequirement} className="flex flex-col gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Requirement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FedRAMP Moderate Authorization"
                    value={newReq.title}
                    onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Category</label>
                    <select
                      value={newReq.category}
                      onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Security">Security</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Technical">Technical</option>
                      <option value="SLA">SLA / Performance</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Priority</label>
                    <select
                      value={newReq.priority}
                      onChange={(e) => setNewReq({ ...newReq, priority: e.target.value as any })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="MUST_HAVE">MUST HAVE (Kill Gate)</option>
                      <option value="SHOULD_HAVE">SHOULD HAVE</option>
                      <option value="NICE_TO_HAVE">NICE TO HAVE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Scoring Weight</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newReq.weight}
                      onChange={(e) => setNewReq({ ...newReq, weight: parseInt(e.target.value) || 10 })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Evaluation Type</label>
                    <select
                      value={newReq.evaluation_type}
                      onChange={(e) => setNewReq({ ...newReq, evaluation_type: e.target.value as any })}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="BOOLEAN">BOOLEAN (Pass/Fail)</option>
                      <option value="SCORE">SCORE (0-100)</option>
                      <option value="NUMERIC">NUMERIC (Threshold)</option>
                      <option value="TEXT">TEXT (Qualitative)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Specification Description</label>
                  <textarea
                    rows={2}
                    placeholder="Details on what the vendor must demonstrate..."
                    value={newReq.description}
                    onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-sm border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-outline-variant rounded-lg text-[13px] font-semibold hover:bg-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-primary-container shadow-sm"
                  >
                    Save Requirement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
