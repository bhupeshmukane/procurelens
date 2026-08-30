import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api, Requirement } from '../../services/api';

export const EvaluationSetup: React.FC = () => {
  const { setActiveTab, setActiveEvalId, fetchEvaluations } = useEvaluation();
  const [title, setTitle] = useState('Enterprise Cloud Analytics & Intelligence Platform');
  const [category, setCategory] = useState('Cloud Infrastructure');
  const [description, setDescription] = useState('Evaluating 3 top-tier cloud enterprise providers across TCO, SOC2 compliance, 99.9% SLAs, and architecture.');
  const [userCount, setUserCount] = useState(1000);
  const [storageTb, setStorageTb] = useState(50);
  const [supportTier, setSupportTier] = useState('24/7 Enterprise Platinum');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requirements, setRequirements] = useState<Requirement[]>([
    {
      category: 'Compliance',
      title: 'SOC 2 Type II Certified',
      description: 'Vendor must maintain an active, annually audited SOC 2 Type II certification.',
      is_mandatory: true,
      weight: 2,
    },
    {
      category: 'Compliance',
      title: 'US Data Residency & Sovereignty',
      description: 'Customer production data and backups must reside strictly within US data centers.',
      is_mandatory: true,
      weight: 2,
    },
    {
      category: 'SLA',
      title: '99.9% Uptime SLA with Credits',
      description: 'Guaranteed minimum monthly availability of 99.9% with financial service credit remedies.',
      is_mandatory: true,
      weight: 1,
    },
    {
      category: 'Security',
      title: 'SAML 2.0 & SCIM User Provisioning',
      description: 'Native Single Sign-On and automated directory provisioning with Okta/Azure AD.',
      is_mandatory: false,
      weight: 1,
    },
    {
      category: 'Technical',
      title: 'Enterprise REST APIs & Webhooks',
      description: 'Comprehensive REST APIs and event webhooks for enterprise data pipelines.',
      is_mandatory: false,
      weight: 1,
    },
  ]);

  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('Technical');
  const [newReqMandatory, setNewReqMandatory] = useState(false);

  const handleAddRequirement = () => {
    if (!newReqTitle.trim()) return;
    setRequirements([
      ...requirements,
      {
        category: newReqCategory,
        title: newReqTitle,
        description: 'Custom buyer requirement',
        is_mandatory: newReqMandatory,
        weight: 1,
      },
    ]);
    setNewReqTitle('');
    setNewReqMandatory(false);
  };

  const handleToggleMandatory = (index: number) => {
    const updated = [...requirements];
    updated[index].is_mandatory = !updated[index].is_mandatory;
    setRequirements(updated);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createEvaluation({
        title,
        category,
        description,
        requirements,
        assumptions: {
          user_count: userCount,
          storage_tb: storageTb,
          support_tier: supportTier,
          annual_growth_rate: 0.15,
          contract_term_years: 3,
        },
        weights: {
          weight_tco: 35,
          weight_technical: 25,
          weight_compliance: 20,
          weight_risk: 10,
          weight_sla: 10,
        },
      });
      await fetchEvaluations();
      setActiveEvalId(res.id);
      setActiveTab('upload');
    } catch (e) {
      console.error('Failed to create evaluation:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl flex justify-center">
      <div className="w-full max-w-[900px] flex flex-col gap-xl">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-md">
          <div>
            <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Step 1 of 3</span>
            <h1 className="font-headline-lg text-[24px] font-bold text-on-surface">Configure Procurement RFP</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Saving...' : 'Next: Upload Proposals &rarr;'}</span>
          </button>
        </div>

        {/* Section 1: RFP Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-sm">
          <h2 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Project & RFP Metadata
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">RFP Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Enterprise Cloud Analytics Solution"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Procurement Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Cloud Infrastructure, SaaS, Security"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Evaluation Scope & Context</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="Brief summary of the business needs and procurement objectives..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Usage Assumptions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-sm">
          <h2 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calculate</span>
            3-Year TCO Usage Assumptions
          </h2>
          <p className="text-[13px] text-on-surface-variant">
            These parameters will feed into the deterministic Python TCO engine to project 3-year recurring spend and cost-per-user benchmarks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Target User Count</label>
              <input
                type="number"
                value={userCount}
                onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface font-semibold tabular-nums focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Storage Baseline (TB)</label>
              <input
                type="number"
                value={storageTb}
                onChange={(e) => setStorageTb(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface font-semibold tabular-nums focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Required Support Level</label>
              <input
                type="text"
                value={supportTier}
                onChange={(e) => setSupportTier(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-[14px] text-on-surface font-semibold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Requirements & Kill Criteria */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rule</span>
                RFP Requirements & Kill-Criteria Gates
              </h2>
              <p className="text-[12.5px] text-on-surface-variant mt-0.5">
                Requirements marked as <strong className="text-error">Kill-Criteria</strong> will trigger automatic deterministic disqualification if a vendor fails compliance.
              </p>
            </div>
          </div>

          {/* Requirements List */}
          <div className="divide-y divide-outline-variant/60 border border-outline-variant rounded-lg overflow-hidden bg-white">
            {requirements.map((req, idx) => (
              <div key={idx} className="p-md flex items-center justify-between gap-md hover:bg-surface/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
                      {req.category}
                    </span>
                    <span className="text-[14px] font-bold text-on-surface">{req.title}</span>
                    {req.is_mandatory && (
                      <span className="inline-flex items-center gap-1 bg-error/10 text-error border border-error/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[12px]">gavel</span>
                        MANDATORY KILL CRITERIA
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-on-surface-variant">{req.description}</p>
                </div>

                <div className="flex items-center gap-md shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-on-surface select-none">
                    <input
                      type="checkbox"
                      checked={req.is_mandatory}
                      onChange={() => handleToggleMandatory(idx)}
                      className="h-4 w-4 rounded text-error focus:ring-error"
                    />
                    <span className={req.is_mandatory ? 'text-error font-bold' : 'text-on-surface-variant'}>
                      Kill Criteria
                    </span>
                  </label>
                  <button
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                    title="Remove requirement"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Requirement Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-surface p-sm rounded-lg border border-outline-variant">
            <select
              value={newReqCategory}
              onChange={(e) => setNewReqCategory(e.target.value)}
              className="bg-white border border-outline-variant rounded-md px-2 py-1.5 text-[13px] font-medium outline-none"
            >
              <option value="Compliance">Compliance</option>
              <option value="Security">Security</option>
              <option value="Technical">Technical</option>
              <option value="SLA">SLA</option>
              <option value="Commercial">Commercial</option>
            </select>
            <input
              type="text"
              value={newReqTitle}
              onChange={(e) => setNewReqTitle(e.target.value)}
              placeholder="Add new custom requirement title..."
              className="flex-1 bg-white border border-outline-variant rounded-md px-3 py-1.5 text-[13px] outline-none"
            />
            <label className="flex items-center gap-1.5 text-[12px] font-semibold px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newReqMandatory}
                onChange={(e) => setNewReqMandatory(e.target.checked)}
                className="h-3.5 w-3.5 text-error rounded"
              />
              <span>Kill Criteria</span>
            </label>
            <button
              onClick={handleAddRequirement}
              className="bg-surface-container border border-outline-variant hover:bg-surface-variant text-on-surface text-[12px] font-bold px-3 py-1.5 rounded-md"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-md pt-sm">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-[14px] px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <span>Proceed to Step 2: Upload Proposals</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
