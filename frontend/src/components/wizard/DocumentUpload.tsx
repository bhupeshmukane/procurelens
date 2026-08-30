import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { api } from '../../services/api';

export const DocumentUpload: React.FC = () => {
  const { activeEval, activeEvalId, loadEvaluation, setActiveTab, triggerPipeline } = useEvaluation();
  const [isUploading, setIsUploading] = useState(false);
  const [vendorNameInput, setVendorNameInput] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeEvalId) return;

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await api.uploadDocument(activeEvalId, file, vendorNameInput.trim() || undefined);
      }
      setVendorNameInput('');
      await loadEvaluation(activeEvalId);
      setUploadFeedback(`Successfully uploaded and parsed ${files.length} proposal document(s).`);
    } catch (err: any) {
      setUploadFeedback(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeedSamples = async () => {
    if (!activeEvalId) return;
    setIsUploading(true);
    setUploadFeedback(null);
    try {
      await api.seedSampleDocuments(activeEvalId);
      await loadEvaluation(activeEvalId);
      setUploadFeedback('Successfully seeded 3 realistic vendor proposals (CloudCore, Vertex Systems, Nexus Cloud).');
    } catch (err: any) {
      setUploadFeedback(`Seeding failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadedDocs = activeEval?.vendors?.flatMap((v) =>
    (v.documents || []).map((d) => ({
      ...d,
      vendor_name: v.name,
    }))
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl flex justify-center">
      <div className="w-full max-w-[850px] flex flex-col gap-xl">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-md">
          <div>
            <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Step 2 of 3</span>
            <h1 className="font-headline-lg text-[24px] font-bold text-on-surface">Upload Evidence Documents</h1>
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={handleSeedSamples}
              disabled={isUploading}
              className="flex items-center gap-1.5 bg-surface-container border border-outline-variant hover:bg-surface-variant text-on-surface text-[13px] font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">cloud_sync</span>
              <span>1-Click Seed Sample Proposals</span>
            </button>
          </div>
        </div>

        {/* Header Intro */}
        <div>
          <p className="text-on-surface-variant text-[14px] leading-relaxed">
            Securely upload 2–3 vendor proposals, pricing sheets, and technical disclosures in PDF format.
            ProcureLens parses each PDF page by page, anchoring every clause for cryptographically auditable extraction.
          </p>
        </div>

        {/* Feedback Alert */}
        {uploadFeedback && (
          <div className={`p-md rounded-xl text-[13px] font-medium border flex items-center gap-2 ${
            uploadFeedback.includes('failed')
              ? 'bg-error-container/20 border-error/30 text-error'
              : 'bg-tertiary-container/15 border-tertiary-container/30 text-tertiary-container'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {uploadFeedback.includes('failed') ? 'error' : 'check_circle'}
            </span>
            <span>{uploadFeedback}</span>
          </div>
        )}

        {/* Optional Vendor Name Input */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md">
          <label className="text-[12px] font-semibold text-on-surface-variant whitespace-nowrap">Vendor Name (Optional):</label>
          <input
            type="text"
            value={vendorNameInput}
            onChange={(e) => setVendorNameInput(e.target.value)}
            placeholder="e.g. CloudCore, Vertex Systems (Defaults to PDF name)"
            className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Drag & Drop Dropzone */}
        <div className="border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 p-xl flex flex-col items-center justify-center text-center cursor-pointer group relative">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="h-16 w-16 rounded-full bg-surface-container group-hover:bg-primary-container/20 flex items-center justify-center mb-md transition-colors">
            <span className="material-symbols-outlined text-[36px] text-primary">cloud_upload</span>
          </div>
          <h3 className="font-headline-md text-[17px] font-bold text-on-surface mb-1">
            Drag & Drop Vendor PDFs Here
          </h3>
          <p className="text-[13px] text-on-surface-variant mb-md">
            Supports multi-page proposals, pricing schedules & contracts
          </p>
          <div className="bg-surface-container border border-outline-variant text-on-surface font-semibold text-[13px] py-2 px-5 rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-all">
            {isUploading ? 'Parsing Pages...' : 'Browse PDF Files'}
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
              Anchored Vendor Proposals ({uploadedDocs.length})
            </h3>
            {uploadedDocs.length > 0 && (
              <span className="text-[12px] text-tertiary-container font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-tertiary-container"></span>
                Ready for AI Extraction
              </span>
            )}
          </div>

          {uploadedDocs.length === 0 ? (
            <div className="bg-surface border border-outline-variant rounded-xl p-lg text-center text-on-surface-variant text-[13px]">
              No proposals uploaded yet. Drag and drop PDFs above or click "1-Click Seed Sample Proposals".
            </div>
          ) : (
            <div className="space-y-sm">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between gap-md shadow-sm"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[15px] text-on-surface truncate">{doc.vendor_name}</span>
                        <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tabular-nums">
                          {doc.page_count} Pages Anchored
                        </span>
                      </div>
                      <p className="text-[12.5px] text-on-surface-variant truncate">{doc.filename}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-md shrink-0">
                    <span className="inline-flex items-center gap-1 bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px] fill">check_circle</span>
                      PARSED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center pt-md border-t border-outline-variant">
          <button
            onClick={() => setActiveTab('setup')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Step 1
          </button>

          <button
            onClick={() => {
              setActiveTab('pipeline');
              triggerPipeline();
            }}
            disabled={uploadedDocs.length === 0 || isUploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-[14px] px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-40"
          >
            <span>Proceed to Step 3: Run AI Pipeline</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
