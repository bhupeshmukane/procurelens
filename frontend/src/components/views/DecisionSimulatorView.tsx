import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api, SimulationResult, ScoringWeights } from '../../services/api';

interface ScenarioPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  weights: ScoringWeights;
  tcoAssumptions?: {
    vendor_name: string;
    escalation_rate: number;
  };
  reqOverride?: {
    reqTitleMatch: string;
    newPriority: 'MUST_HAVE' | 'SHOULD_HAVE';
  };
}

export const DecisionSimulatorView: React.FC = () => {
  const { activeEval, setActiveTab } = useEvaluation();
  const [activePreset, setActivePreset] = useState<string>('baseline');
  const [weights, setWeights] = useState<ScoringWeights>({
    weight_tco: 35,
    weight_technical: 25,
    weight_compliance: 20,
    weight_risk: 10,
    weight_sla: 10,
  });

  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [scenarioEscalation, setScenarioEscalation] = useState<number>(0.07);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<{ name: string; result: SimulationResult }[]>([]);
  const [reqPriorityOverrides, setReqPriorityOverrides] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize from active evaluation
  useEffect(() => {
    if (activeEval) {
      const w = activeEval.weights;
      const canonicalWeights: ScoringWeights = {
        weight_tco: Number(w?.weight_tco ?? 35),
        weight_technical: Number(w?.weight_technical ?? 25),
        weight_compliance: Number(w?.weight_compliance ?? 20),
        weight_risk: Number(w?.weight_risk ?? 10),
        weight_sla: Number(w?.weight_sla ?? 10),
      };
      setWeights(canonicalWeights);

      // Default selected vendor to Vertex Systems if exists
      const vertex = activeEval.vendors?.find((v) => v.name.toLowerCase().includes('vertex'));
      if (vertex) {
        setSelectedVendorId(vertex.id);
        const vxTco = activeEval.tco_results?.find((t) => t.vendor_id === vertex.id);
        if (vxTco) setScenarioEscalation(vxTco.escalation_rate || 0.07);
      } else if (activeEval.vendors && activeEval.vendors.length > 0) {
        setSelectedVendorId(activeEval.vendors[0].id);
      }

      // Initial simulation run
      triggerSimulation(canonicalWeights, undefined, {});
    }
  }, [activeEval?.id]);

  const presets: ScenarioPreset[] = [
    {
      id: 'baseline',
      label: 'Current Baseline',
      icon: 'sync',
      description: 'Production procurement model (Commercial 35%, Technical 25%, Security 20%)',
      weights: { weight_tco: 35, weight_technical: 25, weight_compliance: 20, weight_risk: 10, weight_sla: 10 },
    },
    {
      id: 'security_first',
      label: 'Security-First',
      icon: 'verified_user',
      description: 'Prioritize data sovereignty, SOC 2 / ISO 27001 compliance (Security 45%)',
      weights: { weight_tco: 20, weight_technical: 25, weight_compliance: 45, weight_risk: 5, weight_sla: 5 },
    },
    {
      id: 'cost_focused',
      label: 'Cost & TCO First',
      icon: 'savings',
      description: 'Prioritize 3-Year baseline cash spend & low subscription pricing (Commercial 50%)',
      weights: { weight_tco: 50, weight_technical: 20, weight_compliance: 15, weight_risk: 10, weight_sla: 5 },
    },
    {
      id: 'tech_depth',
      label: 'Technical Depth',
      icon: 'developer_mode',
      description: 'Prioritize GraphQL APIs, SAML SCIM, and developer sandbox (Technical 50%)',
      weights: { weight_tco: 20, weight_technical: 50, weight_compliance: 15, weight_risk: 10, weight_sla: 5 },
    },
    {
      id: 'negotiated_vertex',
      label: 'Negotiated Vertex (3% Escalator)',
      icon: 'handshake',
      description: 'Simulate successful negotiation reducing Vertex annual escalation from 7% to 3%',
      weights: { weight_tco: 35, weight_technical: 25, weight_compliance: 20, weight_risk: 10, weight_sla: 10 },
      tcoAssumptions: {
        vendor_name: 'Vertex Systems',
        escalation_rate: 0.03,
      },
    },
  ];

  const triggerSimulation = async (
    targetWeights: ScoringWeights,
    tcoAssump?: { vendor_id?: string; escalation_rate?: number },
    reqOverrides?: Record<string, string>
  ) => {
    if (!activeEval) return;
    setIsSimulating(true);
    try {
      const payload = {
        scenario_name: presets.find((p) => p.id === activePreset)?.label || 'Custom Scenario',
        weights: targetWeights,
        tco_assumptions: tcoAssump || (selectedVendorId ? { vendor_id: selectedVendorId, escalation_rate: scenarioEscalation } : undefined),
        requirement_overrides: reqOverrides || reqPriorityOverrides,
      };
      const res = await api.runSimulation(activeEval.id, payload);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleWeightSliderChange = (key: keyof ScoringWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    setActivePreset('custom');
    triggerSimulation(newWeights);
  };

  const handleAutoBalance = () => {
    const currentSum =
      Number(weights.weight_tco || 0) +
      Number(weights.weight_technical || 0) +
      Number(weights.weight_compliance || 0) +
      Number(weights.weight_risk || 0) +
      Number(weights.weight_sla || 0);

    if (currentSum === 0) {
      const defaultBalanced: ScoringWeights = {
        weight_tco: 35,
        weight_technical: 25,
        weight_compliance: 20,
        weight_risk: 10,
        weight_sla: 10,
      };
      setWeights(defaultBalanced);
      triggerSimulation(defaultBalanced);
      return;
    }

    const factor = 100 / currentSum;
    const wt_tco = Math.round(Number(weights.weight_tco || 0) * factor);
    const wt_tech = Math.round(Number(weights.weight_technical || 0) * factor);
    const wt_comp = Math.round(Number(weights.weight_compliance || 0) * factor);
    const wt_risk = Math.round(Number(weights.weight_risk || 0) * factor);
    const wt_sla = 100 - (wt_tco + wt_tech + wt_comp + wt_risk);

    const balanced: ScoringWeights = {
      weight_tco: Math.max(0, wt_tco),
      weight_technical: Math.max(0, wt_tech),
      weight_compliance: Math.max(0, wt_comp),
      weight_risk: Math.max(0, wt_risk),
      weight_sla: Math.max(0, wt_sla),
    };
    setWeights(balanced);
    triggerSimulation(balanced);
  };

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset.id);
    setWeights(preset.weights);

    let tcoOverride = undefined;
    if (preset.tcoAssumptions) {
      const targetVend = activeEval?.vendors?.find((v) => v.name.toLowerCase().includes(preset.tcoAssumptions!.vendor_name.toLowerCase()));
      if (targetVend) {
        setSelectedVendorId(targetVend.id);
        setScenarioEscalation(preset.tcoAssumptions.escalation_rate);
        tcoOverride = { vendor_id: targetVend.id, escalation_rate: preset.tcoAssumptions.escalation_rate };
      }
    }

    triggerSimulation(preset.weights, tcoOverride);
  };

  const handleSaveScenario = () => {
    if (!simulationResult) return;
    const name = `${presets.find((p) => p.id === activePreset)?.label || 'Custom'} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    setSavedScenarios((prev) => [...prev, { name, result: simulationResult }]);
    setSaveSuccessMsg(`Scenario '${name}' saved to executive session!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const totalWeight =
    Number(weights.weight_tco || 0) +
    Number(weights.weight_technical || 0) +
    Number(weights.weight_compliance || 0) +
    Number(weights.weight_risk || 0) +
    Number(weights.weight_sla || 0);
  const isBalanced = totalWeight === 100;

  if (!activeEval) {
    return (
      <div className="flex-1 p-xl text-center text-on-surface-variant">
        No evaluation loaded. Please select or seed a demo evaluation first.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg bg-background">
      {/* Top Header & Simulation Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
            <h1 className="font-headline-lg text-[22px] font-bold text-on-surface">
              Procurement Decision Simulator
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Deterministic What-If Engine
            </span>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Test procurement priority shifts, contractual escalators, and requirement changes. View instant rank deltas and verified contribution drivers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-sm">
          {simulationResult && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container border border-outline-variant text-[12px] text-on-surface-variant font-mono">
              <span className="material-symbols-outlined text-[14px] text-tertiary">bolt</span>
              Calc: <strong className="text-on-surface">{simulationResult.calc_time_ms} ms</strong>
            </div>
          )}
          <button
            onClick={() => handleSelectPreset(presets[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-[13px] font-medium text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset Baseline
          </button>
          <button
            onClick={handleSaveScenario}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-[13px] font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">bookmark</span>
            Save Scenario
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-md py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {saveSuccessMsg}
        </div>
      )}

      {/* Preset Scenario Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant whitespace-nowrap mr-1">
          Scenarios:
        </span>
        {presets.map((preset) => {
          const isSel = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
                isSel
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'bg-surface-container-low border border-outline-variant hover:bg-surface-container text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${isSel ? 'fill' : ''}`}>
                {preset.icon}
              </span>
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Interactive Parameters (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-md">
          {/* Card 1: Priority Sliders */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">sliders</span>
                <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                  Procurement Priorities
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded ${
                    isBalanced
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                      : 'bg-error/10 text-error border border-error/30'
                  }`}
                >
                  Total: {totalWeight}% {isBalanced ? '✓' : ''}
                </span>
                {!isBalanced && (
                  <button
                    onClick={handleAutoBalance}
                    className="text-[11px] font-bold text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded border border-primary/20 transition-colors"
                  >
                    Auto-100%
                  </button>
                )}
              </div>
            </div>

            {/* Validation Alert if not 100% */}
            {!isBalanced && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">warning</span>
                  Adjust weights to total 100% (currently {totalWeight}%)
                </span>
                <button
                  onClick={handleAutoBalance}
                  className="text-[11px] font-bold text-primary underline"
                >
                  Auto-Balance
                </button>
              </div>
            )}

            {/* Sliders */}
            <div className="flex flex-col gap-sm">
              {/* Technical */}
              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                    Technical & Functional Fit
                  </span>
                  <span className="font-mono font-bold">{weights.weight_technical}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.weight_technical}
                  onChange={(e) => handleWeightSliderChange('weight_technical', Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
              </div>

              {/* Commercial */}
              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">payments</span>
                    Commercial & 3-Year TCO
                  </span>
                  <span className="font-mono font-bold">{weights.weight_tco}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.weight_tco}
                  onChange={(e) => handleWeightSliderChange('weight_tco', Number(e.target.value))}
                  className="w-full accent-tertiary cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
              </div>

              {/* Security */}
              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-error">security</span>
                    Security & Compliance
                  </span>
                  <span className="font-mono font-bold">{weights.weight_compliance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.weight_compliance}
                  onChange={(e) => handleWeightSliderChange('weight_compliance', Number(e.target.value))}
                  className="w-full accent-error cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
              </div>

              {/* Risk */}
              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">warning</span>
                    Contractual Risk Penalty
                  </span>
                  <span className="font-mono font-bold">{weights.weight_risk}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.weight_risk}
                  onChange={(e) => handleWeightSliderChange('weight_risk', Number(e.target.value))}
                  className="w-full accent-secondary cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
              </div>

              {/* SLA */}
              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                    SLA & Support Reliability
                  </span>
                  <span className="font-mono font-bold">{weights.weight_sla}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.weight_sla}
                  onChange={(e) => handleWeightSliderChange('weight_sla', Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Card 2: What-If TCO Simulator */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">trending_down</span>
                <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                  Contract Escalation What-If
                </h2>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">Deterministic TCO</span>
            </div>

            <div className="flex flex-col gap-sm">
              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant block mb-1">
                  Target Vendor Proposal:
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => {
                    setSelectedVendorId(e.target.value);
                    const t = activeEval.tco_results?.find((x) => x.vendor_id === e.target.value);
                    if (t) setScenarioEscalation(t.escalation_rate || 0.0);
                  }}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-[13px] font-medium text-on-surface"
                >
                  {activeEval.vendors?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[13px] font-medium text-on-surface mb-1">
                  <span>Simulated Annual Escalator:</span>
                  <span className="font-mono font-bold text-primary">{(scenarioEscalation * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.15"
                  step="0.005"
                  value={scenarioEscalation}
                  onChange={(e) => {
                    const esc = Number(e.target.value);
                    setScenarioEscalation(esc);
                    triggerSimulation(weights, { vendor_id: selectedVendorId, escalation_rate: esc });
                  }}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-mono mt-0.5">
                  <span>0.0% (Fixed Rate)</span>
                  <span>3.0% (CPI Target)</span>
                  <span>7.0% (Current Vertex)</span>
                  <span>15.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Requirement What-If */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                  Requirement Gating What-If
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">
                Scenario Only
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant">
              Temporarily adjust kill-criteria policy to observe qualification impact without modifying production database.
            </p>
            <div className="flex flex-col gap-1.5">
              {activeEval.requirements?.slice(0, 3).map((req) => {
                const effectivePriority = reqPriorityOverrides[req.id] || req.priority || (req.is_mandatory ? 'MUST_HAVE' : 'SHOULD_HAVE');
                const isMandatory = effectivePriority === 'MUST_HAVE';
                return (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-container text-[12px]">
                    <span className="font-medium truncate max-w-[200px] text-on-surface">{req.title}</span>
                    <button
                      onClick={() => {
                        const newP = isMandatory ? 'SHOULD_HAVE' : 'MUST_HAVE';
                        const updated = { ...reqPriorityOverrides, [req.id]: newP };
                        setReqPriorityOverrides(updated);
                        triggerSimulation(weights, undefined, updated);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        isMandatory
                          ? 'bg-error/15 text-error border border-error/30'
                          : 'bg-primary/15 text-primary border border-primary/30'
                      }`}
                    >
                      {isMandatory ? 'MUST_HAVE (Kill Gate)' : 'SHOULD_HAVE'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Decision Outcomes & Deterministic Explanation (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-md">
          {/* Card 1: Decision Outcome Matrix (Side-by-Side) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">compare_arrows</span>
                <h2 className="font-title-md text-[16px] font-bold text-on-surface">
                  Decision Outcome: Baseline vs Scenario
                </h2>
              </div>
              {simulationResult?.decision_changed ? (
                <span className="bg-tertiary/15 text-tertiary border border-tertiary/30 px-2.5 py-0.5 rounded-full text-[12px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                  Decision Shifted
                </span>
              ) : (
                <span className="bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-[12px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Winner Invariant
                </span>
              )}
            </div>

            {/* Side-by-Side Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    <th className="py-2 px-3">Vendor</th>
                    <th className="py-2 px-3 text-center">Baseline Rank</th>
                    <th className="py-2 px-3 text-center">Scenario Rank</th>
                    <th className="py-2 px-3 text-right">Baseline Score</th>
                    <th className="py-2 px-3 text-right">Scenario Score</th>
                    <th className="py-2 px-3 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-[13px]">
                  {simulationResult?.rank_changes?.map((rc) => {
                    const isWinner = rc.scenario_rank === 1 && !rc.is_disqualified;
                    const isDQ = rc.is_disqualified;
                    return (
                      <tr
                        key={rc.vendor_id}
                        className={`transition-colors ${
                          isWinner ? 'bg-primary/5 font-semibold' : isDQ ? 'bg-error/5 opacity-75' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface">{rc.vendor_name}</span>
                            {isWinner && (
                              <span className="bg-primary text-on-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Winner #1
                              </span>
                            )}
                            {isDQ && (
                              <span className="bg-error text-on-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Disqualified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {rc.baseline_rank === 3 && isDQ ? (
                            <span className="text-error font-bold">DQ (#3)</span>
                          ) : (
                            `#${rc.baseline_rank}`
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {isDQ ? (
                            <span className="text-error font-bold">DQ (#{rc.scenario_rank})</span>
                          ) : (
                            <span className={rc.rank_delta > 0 ? 'text-tertiary font-bold' : rc.rank_delta < 0 ? 'text-error font-bold' : ''}>
                              #{rc.scenario_rank} {rc.rank_delta > 0 ? '▲' : rc.rank_delta < 0 ? '▼' : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-on-surface-variant">
                          {rc.baseline_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">
                          {rc.scenario_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {rc.score_delta > 0 ? (
                            <span className="text-tertiary">+{rc.score_delta.toFixed(1)}</span>
                          ) : rc.score_delta < 0 ? (
                            <span className="text-error">{rc.score_delta.toFixed(1)}</span>
                          ) : (
                            <span className="text-on-surface-variant">0.0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Disqualification Invariance Banner */}
            <div className="bg-surface-container border border-outline-variant rounded-lg p-3 text-[12px] flex items-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">lock</span>
              <div>
                <strong className="text-on-surface">Mandatory requirements override weighted scoring.</strong> Ranking cannot override mandatory compliance requirements. Disqualified vendors remain strictly barred from top recommendation.
              </div>
            </div>
          </div>

          {/* Card 2: Deterministic "Why Did The Decision Change?" Explanation */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-sm">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
              <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                Why Did The Decision Change? (Contribution Drivers)
              </h2>
            </div>

            <div className="p-3 rounded-lg bg-surface-container text-[13px] text-on-surface font-medium leading-relaxed">
              {simulationResult?.summary}
            </div>

            {/* Driver Contribution Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {simulationResult?.primary_drivers?.map((driver, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-low flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[12px]">
                    <strong className="text-on-surface">{driver.criterion}</strong>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                      {driver.weight_change}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    {driver.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: TCO Scenario & Negotiation Savings */}
          {simulationResult?.tco_comparison && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-sm">
              <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">savings</span>
                  <h2 className="font-title-md text-[15px] font-bold text-on-surface">
                    {simulationResult.tco_comparison.vendor_name} — TCO Scenario Impact
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('negotiation')}
                  className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Negotiation Playbook <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-md mt-1">
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Baseline 3-Yr TCO</span>
                  <div className="font-mono text-[16px] font-bold text-on-surface mt-1">
                    ${simulationResult.tco_comparison.baseline_3yr_tco.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    {(simulationResult.tco_comparison.baseline_escalation * 100).toFixed(1)}% Escalator
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Scenario 3-Yr TCO</span>
                  <div className="font-mono text-[16px] font-bold text-primary mt-1">
                    ${simulationResult.tco_comparison.scenario_3yr_tco.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    {(simulationResult.tco_comparison.scenario_escalation * 100).toFixed(1)}% Escalator
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/30 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-tertiary uppercase font-bold">Projected Savings</span>
                  <div className="font-mono text-[16px] font-black text-tertiary mt-1">
                    ${simulationResult.tco_comparison.savings_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-tertiary font-medium">
                    {simulationResult.tco_comparison.savings_percentage > 0 ? `-${simulationResult.tco_comparison.savings_percentage}% reduction` : '0% delta'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DecisionSimulatorView;
