'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import Button from './Button';
import type { PdfBrandingConfig } from '@/lib/supabase/types';
import { uploadPdfBrandingLogo } from '@/lib/supabase/storage';

interface PDFBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialConfig: PdfBrandingConfig;
  onGenerate: (args: { config: PdfBrandingConfig; saveAsDefault: boolean; saveToCompany: boolean }) => void | Promise<void>;
  allowSaveAsDefault?: boolean;
  allowSaveToCompany?: boolean;
}

const DEFAULT_CONFIG: PdfBrandingConfig = {
  version: 1,
  accent: 'primary',
  accent_hex: null,
  logo: null,
  watermark: { type: 'none', opacity: 0.15 },
  footer: { text: null },
};

export default function PDFBrandingModal({
  isOpen,
  onClose,
  userId,
  initialConfig,
  onGenerate,
  allowSaveAsDefault = true,
  allowSaveToCompany = false,
}: PDFBrandingModalProps) {
  const resolvedInitial = useMemo(() => {
    return initialConfig || DEFAULT_CONFIG;
  }, [initialConfig]);

  const [config, setConfig] = useState<PdfBrandingConfig>(resolvedInitial);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveToCompany, setSaveToCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setConfig(resolvedInitial);
    setSaveAsDefault(false);
    setSaveToCompany(false);
    setUploadingLogo(false);
    setLogoError(null);
  }, [isOpen, resolvedInitial]);

  const handleLogoUpload = async (file: File) => {
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const { url, error } = await uploadPdfBrandingLogo(userId, file);
      if (error || !url) {
        throw error || new Error('Failed to upload logo');
      }

      setConfig((prev: PdfBrandingConfig) => ({
        ...prev,
        logo: {
          url,
          placement: prev.logo?.placement || 'header_left',
        },
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload logo';
      setLogoError(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const canShowWatermarkText = config.watermark?.type === 'text';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10000" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(10, 14, 39, 0.85)' }} />
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
              <Dialog.Panel
                className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neu-border"
                style={{ backgroundColor: 'var(--neu-surface)' }}
              >
                <div className="sticky top-0 p-6 border-b border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Dialog.Title className="text-2xl font-bold text-neu-text-primary mb-1">
                        PDF Styling
                      </Dialog.Title>
                      <p className="text-sm text-neu-text-secondary">
                        Customize your resume PDF export. You can save one default for future exports.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
                      style={{ backgroundColor: 'var(--neu-surface)' }}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
                  <section className="neu-card-raised p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-neu-text-primary">Branding</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.accent_hex || '#000000'}
                            onChange={(e) =>
                              setConfig((prev: PdfBrandingConfig) => ({
                                ...prev,
                                accent_hex: e.target.value,
                              }))
                            }
                            className="h-10 w-12 rounded-lg border border-neu-border"
                            aria-label="Accent color"
                          />
                          <input
                            value={config.accent_hex || ''}
                            onChange={(e) =>
                              setConfig((prev: PdfBrandingConfig) => ({
                                ...prev,
                                accent_hex: e.target.value || null,
                              }))
                            }
                            placeholder="#RRGGBB"
                            className="neu-input flex-1 p-2 rounded-lg"
                          />
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-neu-text-primary/60 mb-1">
                            Or use theme preset
                          </label>
                          <select
                            value={config.accent || 'primary'}
                            onChange={(e) =>
                              setConfig((prev: PdfBrandingConfig) => ({
                                ...prev,
                                accent: e.target.value as PdfBrandingConfig['accent'],
                                accent_hex: null,
                              }))
                            }
                            className="neu-input w-full p-2 rounded-lg"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="neutral">Neutral</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="danger">Danger</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Footer Text
                        </label>
                        <input
                          value={config.footer?.text || ''}
                          onChange={(e) =>
                            setConfig((prev: PdfBrandingConfig) => ({
                              ...prev,
                              footer: { text: e.target.value || null },
                            }))
                          }
                          placeholder="Optional"
                          className="neu-input w-full p-2 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Logo
                        </label>
                        <div className="space-y-2">
                          <input
                            value={config.logo?.url || ''}
                            onChange={(e) =>
                              setConfig((prev: PdfBrandingConfig) => ({
                                ...prev,
                                logo: e.target.value
                                  ? { url: e.target.value, placement: prev.logo?.placement || 'header_left' }
                                  : null,
                              }))
                            }
                            placeholder="Paste logo URL (optional)"
                            className="neu-input w-full p-2 rounded-lg"
                          />

                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleLogoUpload(file);
                              }}
                              className="neu-input w-full p-2 rounded-lg"
                              disabled={uploadingLogo}
                            />
                          </div>

                          {logoError && (
                            <div className="text-xs text-neu-accent-danger">
                              {logoError}
                            </div>
                          )}
                          {uploadingLogo && (
                            <div className="text-xs text-neu-text-primary/60">
                              Uploading logo...
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Logo Placement
                        </label>
                        <select
                          value={config.logo?.placement || 'header_left'}
                          onChange={(e) =>
                            setConfig((prev: PdfBrandingConfig) => ({
                              ...prev,
                              logo: prev.logo
                                ? { ...prev.logo, placement: e.target.value as 'header_left' | 'header_right' }
                                : { url: '', placement: e.target.value as 'header_left' | 'header_right' },
                            }))
                          }
                          className="neu-input w-full p-2 rounded-lg"
                          disabled={!config.logo?.url}
                        >
                          <option value="header_left">Header Left</option>
                          <option value="header_right">Header Right</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <section className="neu-card-raised p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-neu-text-primary">Watermark</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Type
                        </label>
                        <select
                          value={config.watermark?.type || 'none'}
                          onChange={(e) =>
                            setConfig((prev: PdfBrandingConfig) => ({
                              ...prev,
                              watermark: {
                                type: e.target.value as 'none' | 'text' | 'logo',
                                opacity: prev.watermark?.opacity ?? 0.15,
                                text: prev.watermark?.text,
                              },
                            }))
                          }
                          className="neu-input w-full p-2 rounded-lg"
                        >
                          <option value="none">None</option>
                          <option value="text">Text</option>
                          <option value="logo">Logo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Opacity
                        </label>
                        <input
                          type="range"
                          min={0.05}
                          max={0.35}
                          step={0.05}
                          value={config.watermark?.opacity ?? 0.15}
                          onChange={(e) =>
                            setConfig((prev: PdfBrandingConfig) => ({
                              ...prev,
                              watermark: {
                                type: prev.watermark?.type || 'none',
                                text: prev.watermark?.text,
                                opacity: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full"
                        />
                        <div className="text-xs text-neu-text-primary/60 mt-1">
                          {(config.watermark?.opacity ?? 0.15).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {canShowWatermarkText && (
                      <div>
                        <label className="block text-sm font-medium text-neu-text-primary/70 mb-1">
                          Watermark Text
                        </label>
                        <input
                          value={config.watermark?.text || ''}
                          onChange={(e) =>
                            setConfig((prev: PdfBrandingConfig) => ({
                              ...prev,
                              watermark: {
                                type: prev.watermark?.type || 'text',
                                opacity: prev.watermark?.opacity ?? 0.15,
                                text: e.target.value,
                              },
                            }))
                          }
                          placeholder="CONFIDENTIAL"
                          className="neu-input w-full p-2 rounded-lg"
                        />
                      </div>
                    )}
                  </section>

                  <section className="neu-card-raised p-4 space-y-3">
                    {allowSaveAsDefault && (
                      <>
                        <label className="flex items-center gap-3 text-neu-text-primary">
                          <input
                            type="checkbox"
                            className="neu-checkbox"
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                          />
                          <span className="text-sm font-medium">Save as my default</span>
                        </label>
                        <p className="text-xs text-neu-text-primary/60">
                          This will be used as the starting point for future exports.
                        </p>
                      </>
                    )}

                    {allowSaveToCompany && (
                      <>
                        <label className="flex items-center gap-3 text-neu-text-primary">
                          <input
                            type="checkbox"
                            className="neu-checkbox"
                            checked={saveToCompany}
                            onChange={(e) => setSaveToCompany(e.target.checked)}
                          />
                          <span className="text-sm font-medium">Save as company default</span>
                        </label>
                        <p className="text-xs text-neu-text-primary/60">
                          This will be used for future company exports.
                        </p>
                      </>
                    )}
                  </section>

                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button text="Cancel" onClick={onClose} variant="secondary" />
                    <Button
                      text="Generate PDF"
                      onClick={() => onGenerate({ config, saveAsDefault, saveToCompany })}
                      variant="primary"
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
