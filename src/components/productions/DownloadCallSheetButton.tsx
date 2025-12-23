'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Button from '@/components/Button';
import { generateCallSheetPDF, downloadPDF, ShowDetails } from '@/lib/utils/pdfExport';
import PDFBrandingModal from '@/components/PDFBrandingModal';
import type { PdfBrandingConfig } from '@/lib/supabase/types';
import { getUser } from '@/lib/supabase/auth';
import { getCompany, updateCompanyPdfBranding } from '@/lib/supabase/company';
import { getUserRoleInCompany } from '@/lib/supabase/companyMembers';

interface DownloadCallSheetButtonProps {
  rehearsalEvent: {
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    notes?: string;
  };
  showDetails: ShowDetails;
  companyId?: string | null;
  agendaItems: Array<{
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    assignments: Array<{
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      role_name?: string;
      status?: string;
    }>;
  }>;
}

export default function DownloadCallSheetButton({
  rehearsalEvent,
  showDetails,
  companyId,
  agendaItems,
}: DownloadCallSheetButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyDefaultBranding, setCompanyDefaultBranding] = useState<PdfBrandingConfig | null>(null);
  const [canSaveToCompany, setCanSaveToCompany] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getUser();
        if (!user) return;
        setUserId(user.id);

        if (!companyId) return;
        const company = await getCompany(companyId);
        const role = await getUserRoleInCompany(companyId, user.id);
        setCanSaveToCompany(['owner', 'admin'].includes(String(role || '').toLowerCase()));

        const pdfBranding = (company?.pdf_branding as PdfBrandingConfig | null) || null;
        if (pdfBranding) setCompanyDefaultBranding(pdfBranding);
      } catch {
        // ignore
      }
    };

    void load();
  }, [companyId]);

  const handleDownload = async () => {
    setError(null);
    if (!userId) {
      await runDownload(companyDefaultBranding || undefined);
      return;
    }
    setShowBrandingModal(true);
  };

  const runDownload = async (branding?: PdfBrandingConfig) => {
    setDownloading(true);
    setError(null);

    try {
      const doc = await generateCallSheetPDF(rehearsalEvent, showDetails, agendaItems, branding);
      const dateStr = rehearsalEvent.date.replace(/-/g, '_');
      const filename = `${showDetails.title.replace(/[^a-z0-9]/gi, '_')}_call_sheet_${dateStr}.pdf`;
      downloadPDF(doc, filename);
    } catch (err: any) {
      console.error('Error generating call sheet:', err);
      setError(err.message || 'Failed to generate call sheet');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleDownload}
        disabled={downloading}
        variant="primary"
        className="flex items-center gap-2"
        title="Download call sheet for this rehearsal"
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FileText size={18} />
            <span>Download Call Sheet</span>
          </>
        )}
      </Button>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm z-10 shadow-lg">
          {error}
        </div>
      )}

      {userId && (
        <PDFBrandingModal
          isOpen={showBrandingModal}
          onClose={() => setShowBrandingModal(false)}
          userId={userId}
          initialConfig={companyDefaultBranding || {
            version: 1,
            accent: 'primary',
            accent_hex: null,
            logo: null,
            watermark: { type: 'none', opacity: 0.15 },
            footer: { text: null },
          }}
          allowSaveAsDefault={false}
          allowSaveToCompany={!!companyId && canSaveToCompany}
          onGenerate={async ({ config, saveAsDefault, saveToCompany }) => {
            void saveAsDefault;
            setShowBrandingModal(false);

            if (companyId && saveToCompany && canSaveToCompany) {
              const { error: updateError } = await updateCompanyPdfBranding(companyId, config);
              if (!updateError) setCompanyDefaultBranding(config);
            }

            await runDownload(config);
          }}
        />
      )}
    </div>
  );
}
