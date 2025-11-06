'use client';

import { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { 
  parseResume, 
  extractTextFromFile, 
  isValidResumeFile, 
  getFileTypeName,
  type ParsedResumeEntry,
  type ParseResult 
} from '@/lib/utils/resumeParser';
import Alert from '@/components/ui/feedback/Alert';

interface ResumeImporterProps {
  onImport: (entries: ParsedResumeEntry[]) => void;
  onClose: () => void;
}

export default function ResumeImporter({ onImport, onClose }: ResumeImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!isValidResumeFile(selectedFile)) {
      alert('Please select a valid file (.txt, .pdf, or .docx)');
      return;
    }

    setFile(selectedFile);
    setParseResult(null);
    setSelectedEntries(new Set());

    // Auto-parse if it's a text file
    if (selectedFile.type === 'text/plain') {
      await handleParse(selectedFile);
    }
  };

  const handleParse = async (fileToParse?: File) => {
    const targetFile = fileToParse || file;
    if (!targetFile) return;

    setParsing(true);
    try {
      let text = '';

      // Extract text based on file type
      if (targetFile.type === 'text/plain') {
        text = await extractTextFromFile(targetFile);
      } else if (targetFile.type === 'application/pdf') {
        // PDF parsing requires pdf-parse package
        const { extractTextFromPDF } = await import('@/lib/utils/pdfParser');
        text = await extractTextFromPDF(targetFile);
      } else if (
        targetFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        targetFile.type === 'application/msword'
      ) {
        // DOCX parsing requires mammoth package
        const { extractTextFromDOCX } = await import('@/lib/utils/docxParser');
        text = await extractTextFromDOCX(targetFile);
      }

      // Parse the extracted text
      const result = parseResume(text);
      setParseResult(result);

      // Select all entries by default
      if (result.success) {
        setSelectedEntries(new Set(result.entries.map((_, idx) => idx)));
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseResult({
        success: false,
        entries: [],
        errors: [error instanceof Error ? error.message : 'Failed to parse file'],
      });
    } finally {
      setParsing(false);
    }
  };

  const toggleEntry = (index: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEntries(newSelected);
  };

  const handleImport = () => {
    if (!parseResult) return;

    const entriesToImport = parseResult.entries.filter((_, idx) => 
      selectedEntries.has(idx)
    );

    onImport(entriesToImport);
    onClose();
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="backdrop-blur-md rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {/* Header */}
        <div className="p-6 border-b border-neu-border flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neu-text-primary">
            Import Resume
          </h2>
          <button
            onClick={onClose}
            className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-200px)]">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Select Resume File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neu-border rounded-xl p-8 text-center cursor-pointer hover:border-neu-accent-primary/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-neu-text-primary/40" />
              <p className="text-neu-text-primary font-medium mb-1">
                {file ? file.name : 'Click to upload resume'}
              </p>
              <p className="text-neu-text-primary/60 text-sm">
                Supports .txt, .pdf, and .docx files
              </p>
              {file && (
                <p className="text-neu-accent-primary text-sm mt-2">
                  {getFileTypeName(file)} • {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>

          {/* Format Guide */}
          <Alert variant="info">
            <div className="text-sm">
              <p className="font-medium mb-2">📋 Recommended Format:</p>
              <code className="block bg-neu-surface-dark/50 p-3 rounded text-xs">
                Show Name | Role | Company<br />
                Hamilton | Ensemble | Broadway Theater<br />
                Les Misérables | Javert | Local Playhouse
              </code>
              <p className="mt-2 text-neu-text-primary/70">
                Also supports comma, tab, or dash separators
              </p>
            </div>
          </Alert>

          {/* Parse Button */}
          {file && !parseResult && (
            <button
              onClick={() => handleParse()}
              disabled={parsing}
              className="n-button-primary w-full py-3 rounded-xl font-medium"
            >
              {parsing ? 'Parsing...' : 'Parse Resume'}
            </button>
          )}

          {/* Parse Results */}
          {parseResult && (
            <div className="space-y-4">
              {parseResult.success ? (
                <>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Found {parseResult.entries.length} entries
                    </span>
                  </div>

                  {/* Entry List */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neu-text-primary">
                      Select entries to import:
                    </p>
                    {parseResult.entries.map((entry, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedEntries.has(idx)
                            ? 'border-neu-accent-primary bg-neu-accent-primary/10'
                            : 'border-neu-border hover:border-neu-accent-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(idx)}
                          onChange={() => toggleEntry(idx)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neu-text-primary truncate">
                            {entry.show_name}
                          </div>
                          <div className="text-sm text-neu-text-primary/70">
                            {entry.role_name}
                            {entry.company && ` • ${entry.company}`}
                            {entry.year && ` • ${entry.year}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Select All/None */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEntries(new Set(parseResult.entries.map((_, idx) => idx)))}
                      className="text-sm text-neu-accent-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-neu-text-primary/40">•</span>
                    <button
                      onClick={() => setSelectedEntries(new Set())}
                      className="text-sm text-neu-accent-primary hover:underline"
                    >
                      Select None
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Parsing failed</span>
                  </div>
                  {parseResult.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-neu-text-primary/70">
                      {error}
                    </p>
                  ))}
                  <button
                    onClick={() => setParseResult(null)}
                    className="n-button-secondary px-4 py-2 rounded-xl text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {parseResult?.success && (
          <div className="p-6 border-t border-neu-border flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="n-button-secondary px-6 py-2 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedEntries.size === 0}
              className="n-button-primary px-6 py-2 rounded-xl font-medium"
            >
              Import {selectedEntries.size} {selectedEntries.size === 1 ? 'Entry' : 'Entries'}
            </button>
          </div>
        )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
