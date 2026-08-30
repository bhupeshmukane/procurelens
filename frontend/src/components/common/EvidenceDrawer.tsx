import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { Badge } from './Badge';

export const EvidenceDrawer: React.FC = () => {
  const { isEvidenceDrawerOpen, closeEvidenceDrawer, selectedEvidence } = useEvaluation();
  const [showFullPage, setShowFullPage] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isEvidenceDrawerOpen || !selectedEvidence) return null;

  const handleCopy = () => {
    const citation = `"${selectedEvidence.quote}" — ${selectedEvidence.vendor_name || 'Vendor'} Proposal, Page ${selectedEvidence.page_number} (${selectedEvidence.section_title || 'General'})`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (!selectedEvidence.quote || selectedEvidence.quote.toLowerCase().includes('did not reveal') || selectedEvidence.quote.toLowerCase().includes('not found')) {
      return <Badge type="missing" text="Not Found in Document" />;
    }
    if (selectedEvidence.verified) {
      return <Badge type="verified" text="Source Verified" />;
    }
    return <Badge type="unverified" text="Review Source" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeEvidenceDrawer}
        className="fixed inset-0 bg-on-background/25 backdrop-blur-sm z-50 transition-opacity duration-300"
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[540px] bg-surface-container-lowest shadow-2xl border-l border-outline-variant z-50 flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary fill text-[22px]">fact_check</span>
            <div>
              <h2 className="font-headline-md text-[18px] font-bold text-on-surface">Evidence & Source Anchoring</h2>
              <p className="text-[11px] text-on-surface-variant">Verified Source Evidence</p>
            </div>
          </div>
          <button
            onClick={closeEvidenceDrawer}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 p-1.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
          {/* Metadata Bento Block */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md grid grid-cols-2 gap-md shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</span>
              <span className="text-[14px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                {selectedEvidence.vendor_name || 'Vendor'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Source Document</span>
              <span className="text-[14px] font-medium text-on-surface truncate flex items-center gap-1">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">description</span>
                {selectedEvidence.document_name || 'Proposal.pdf'}
              </span>
            </div>

            <div className="col-span-2 border-t border-outline-variant pt-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Evidence Status:</span>
                {getStatusBadge()}
              </div>
              <span className="text-[12px] font-medium text-on-surface-variant tabular-nums">
                Page {selectedEvidence.page_number}
              </span>
            </div>
          </div>

          {/* Source Document Evidence Canvas */}
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                Document Text Extraction
              </h3>
              <button
                onClick={() => setShowFullPage(!showFullPage)}
                className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showFullPage ? 'unfold_less' : 'unfold_more'}
                </span>
                {showFullPage ? 'Show Quote Only' : 'View Full Page Context'}
              </button>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              
              <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
                <span className="text-[13px] font-semibold text-on-surface">
                  {selectedEvidence.section_title || `Section on Page ${selectedEvidence.page_number}`}
                </span>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Page {selectedEvidence.page_number}
                </span>
              </div>

              <div className="p-md text-[13.5px] leading-relaxed text-on-surface">
                {showFullPage && selectedEvidence.page_text ? (
                  <pre className="font-sans whitespace-pre-wrap text-on-surface text-[12.5px] bg-slate-50 p-sm rounded border border-slate-200">
                    {selectedEvidence.page_text}
                  </pre>
                ) : (
                  <div>
                    <p className="text-on-surface-variant/70 text-[12px] mb-2">Extract from source proposal:</p>
                    <div className="pl-3 border-l-2 border-primary/40 my-2">
                      <span className="highlight-evidence font-medium text-on-surface">
                        "{selectedEvidence.quote}"
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Breakdown Bento */}
          <div className="grid grid-cols-1 gap-md">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-md flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <h4 className="text-[12px] font-bold uppercase tracking-wider">Used In Deterministic Logic</h4>
              </div>
              <ul className="text-[13px] text-on-surface space-y-1 mt-1">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[14px]">arrow_right</span>
                  <span>Deterministic 3-Year TCO Calculation Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[14px]">arrow_right</span>
                  <span>Mandatory Kill-Criteria Verification Check</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[14px]">arrow_right</span>
                  <span>Procurement Risk Scoring & Negotiation Prep</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-outline-variant p-md bg-surface-container-lowest flex items-center justify-between gap-md">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant transition-colors text-[13px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Citation Copied!' : 'Copy Citation'}</span>
          </button>
          <button
            onClick={closeEvidenceDrawer}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors text-[13px] font-semibold shadow-sm"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};
