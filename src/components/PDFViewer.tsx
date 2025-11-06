'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  onClose: () => void;
  fileName?: string;
}

export default function PDFViewer({ pdfUrl, onClose, fileName = 'resume.pdf' }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.click();
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
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
              <Dialog.Panel 
                className="backdrop-blur-md rounded-xl shadow-2xl w-full h-[95vh] flex flex-col"
                style={{ 
                  background: 'var(--neu-surface)', 
                  border: '1px solid var(--neu-border)',
                  maxWidth: '1200px'
                }}
              >
                {/* Header */}
                <div className="p-4 border-b border-neu-border flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-neu-text-primary">
                      Resume
                    </h2>
                    <span className="text-sm text-neu-text-primary/60">
                      {fileName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neu-surface-dark/50 border border-neu-border">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 50}
                        className="p-1.5 rounded hover:bg-neu-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-neu-text-primary" />
                      </button>
                      <span className="text-sm text-neu-text-primary px-2 min-w-[3rem] text-center">
                        {zoom}%
                      </span>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 200}
                        className="p-1.5 rounded hover:bg-neu-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-neu-text-primary" />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={handleOpenNewTab}
                      className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
                      title="Open in New Tab"
                    >
                      <ExternalLink className="w-5 h-5 text-neu-text-primary" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-neu-text-primary" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5 text-neu-text-primary" />
                    </button>
                  </div>
                </div>

                {/* PDF Content */}
                <div className="flex-1 overflow-auto bg-neu-surface-dark/30 p-4">
                  <div className="flex justify-center">
                    <iframe
                      src={`${pdfUrl}#view=FitH`}
                      className="rounded-lg shadow-lg bg-white"
                      style={{
                        width: `${zoom}%`,
                        minWidth: '800px',
                        height: '100%',
                        minHeight: '1000px',
                        border: 'none'
                      }}
                      title="Resume PDF"
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
