import React from 'react';
import { EvaluationProvider, useEvaluation } from './context/EvaluationContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { EvidenceDrawer } from './components/common/EvidenceDrawer';
import { DashboardView } from './components/views/DashboardView';
import { EvaluationSetup } from './components/wizard/EvaluationSetup';
import { DocumentUpload } from './components/wizard/DocumentUpload';
import { PipelineProgress } from './components/views/PipelineProgress';
import { ComparisonView } from './components/views/ComparisonView';
import { ComplianceView } from './components/views/ComplianceView';
import { TCOAnalysisView } from './components/views/TCOAnalysisView';
import { RiskCenterView } from './components/views/RiskCenterView';
import { NegotiationView } from './components/views/NegotiationView';
import { DecisionSimulatorView } from './components/views/DecisionSimulatorView';
import { DecisionTraceView } from './components/views/DecisionTraceView';

const MainContent: React.FC = () => {
  const { activeTab } = useEvaluation();

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'setup':
        return <EvaluationSetup />;
      case 'upload':
        return <DocumentUpload />;
      case 'pipeline':
        return <PipelineProgress />;
      case 'comparison':
        return <ComparisonView />;
      case 'compliance':
        return <ComplianceView />;
      case 'tco':
        return <TCOAnalysisView />;
      case 'risks':
        return <RiskCenterView />;
      case 'negotiation':
        return <NegotiationView />;
      case 'simulator':
        return <DecisionSimulatorView />;
      case 'decision_trace':
        return <DecisionTraceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 ml-[280px] flex flex-col h-full overflow-hidden">
        <TopHeader />
        <main className="flex-1 mt-16 overflow-hidden flex flex-col">
          {renderView()}
        </main>
      </div>

      {/* Slide-out Evidence Drawer */}
      <EvidenceDrawer />
    </div>
  );
};

export function App() {
  return (
    <EvaluationProvider>
      <MainContent />
    </EvaluationProvider>
  );
}

export default App;
