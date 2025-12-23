import jsPDF from 'jspdf';
import type { Profile, UserResume, PdfBrandingConfig, PdfAccent } from '@/lib/supabase/types';

interface CastingHistoryItem {
  id: string;
  show_name: string;
  role: string;
  company_name: string | null;
  company_id: string | null;
  date_of_production: string | null;
  is_understudy: boolean;
  source: 'casting';
  verified: true;
}

interface PDFResumeData {
  profile: Profile;
  manualResumes: UserResume[];
  castingHistory: CastingHistoryItem[];
}

export async function generateResumePDF(data: PDFResumeData, branding?: PdfBrandingConfig): Promise<void> {
  const { profile, manualResumes, castingHistory } = data;
  
  // Create new PDF (letter size: 8.5" x 11")
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.75;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  const lineHeight = 0.2;

  const getCssVar = (name: string) => {
    try {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch {
      return '';
    }
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const cleaned = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  };

  const resolveAccentHex = (accent?: PdfAccent) => {
    const token = accent || 'primary';
    const cssVar =
      token === 'primary'
        ? '--neu-accent-primary'
        : token === 'secondary'
        ? '--neu-accent-secondary'
        : token === 'success'
        ? '--neu-accent-success'
        : token === 'warning'
        ? '--neu-accent-warning'
        : token === 'danger'
        ? '--neu-accent-danger'
        : '--neu-text-primary';

    const value = getCssVar(cssVar);
    return value || '#000000';
  };

  const customAccentHex = typeof branding?.accent_hex === 'string' ? branding.accent_hex.trim() : '';
  const isValidCustomAccent = /^#[0-9a-fA-F]{6}$/.test(customAccentHex);
  const accentHex = isValidCustomAccent ? customAccentHex : resolveAccentHex(branding?.accent);
  const accentRgb = hexToRgb(accentHex) || { r: 0, g: 0, b: 0 };

  const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
      return dataUrl;
    } catch {
      return null;
    }
  };

  const getImageFormatFromDataUrl = (dataUrl: string): 'PNG' | 'JPEG' | null => {
    const lower = dataUrl.toLowerCase();
    if (lower.startsWith('data:image/png')) return 'PNG';
    if (lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/jpg')) return 'JPEG';
    return null;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, options?: any) => {
    doc.text(text, x, y, options);
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ==========================================
  // HEADER - Name and Contact Info
  // ==========================================
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ') || 'Actor Resume';

  const titleBaselineY = yPosition;

  if (branding?.watermark && branding.watermark.type !== 'none') {
    try {
      const gStateCtor = (doc as any).GState;
      const canUseGState = Boolean(gStateCtor && typeof (doc as any).setGState === 'function');
      if (canUseGState) {
        (doc as any).setGState(new gStateCtor({ opacity: branding.watermark.opacity }));
      }

      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);

      if (branding.watermark.type === 'text') {
        const text = branding.watermark.text || 'CONFIDENTIAL';
        doc.text(text, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 35 } as any);
      }

      if (branding.watermark.type === 'logo' && branding.logo?.url) {
        const dataUrl = await loadImageAsDataUrl(branding.logo.url);
        if (dataUrl) {
          const w = 4.0;
          const h = 4.0;
          const format = getImageFormatFromDataUrl(dataUrl);
          if (format) {
            doc.addImage(dataUrl, format, (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
          }
        }
      }

      if (canUseGState) {
        (doc as any).setGState(new gStateCtor({ opacity: 1 }));
      }

      doc.setTextColor(0, 0, 0);
    } catch {
      doc.setTextColor(0, 0, 0);
    }
  }

  if (branding?.logo?.url) {
    const dataUrl = await loadImageAsDataUrl(branding.logo.url);
    if (dataUrl) {
      const logoW = 0.6;
      const logoH = 0.6;
      const logoX = branding.logo.placement === 'header_right'
        ? pageWidth - margin - logoW
        : margin;
      const logoY = titleBaselineY - 0.45;
      try {
        const format = getImageFormatFromDataUrl(dataUrl);
        if (format) {
          doc.addImage(dataUrl, format, logoX, logoY, logoW, logoH);
        }
      } catch {
        try {
          const format = getImageFormatFromDataUrl(dataUrl) || 'JPEG';
          doc.addImage(dataUrl, format, logoX, logoY, logoW, logoH);
        } catch {
          // ignore
        }
      }
    }
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  addText(fullName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 0.35;

  // Contact info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const contactInfo = [];
  if (profile.email) contactInfo.push(profile.email);
  if (profile.location) contactInfo.push(profile.location);
  
  if (contactInfo.length > 0) {
    addText(contactInfo.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 0.25;
  }

  // Divider line
  doc.setLineWidth(0.01);
  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  doc.setDrawColor(0, 0, 0);
  yPosition += 0.3;

  // ==========================================
  // BIO / DESCRIPTION
  // ==========================================
  if (profile.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    addText('ABOUT', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const bioLines = doc.splitTextToSize(profile.description, contentWidth);
    bioLines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      addText(line, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 0.15;
  }

  // ==========================================
  // SKILLS
  // ==========================================
  const skills = profile.skills as string[] | null;
  if (skills && skills.length > 0) {
    checkPageBreak(0.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    addText('SKILLS', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const skillsText = skills.join(' • ');
    const skillLines = doc.splitTextToSize(skillsText, contentWidth);
    skillLines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      addText(line, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 0.15;
  }

  // ==========================================
  // CASTING HISTORY (Verified)
  // ==========================================
  if (castingHistory.length > 0) {
    checkPageBreak(0.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    addText('CASTING HISTORY', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight + 0.05;

    castingHistory.forEach((item) => {
      checkPageBreak(0.6);
      
      // Show title with checkmark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      addText(`✓ ${item.show_name}`, margin, yPosition);
      yPosition += lineHeight;

      // Role
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      const roleText = item.is_understudy 
        ? `${item.role} (Understudy)` 
        : item.role;
      addText(roleText, margin + 0.15, yPosition);
      yPosition += lineHeight - 0.02;

      // Company and date
      doc.setFont('helvetica', 'normal');
      const details = [];
      if (item.company_name) details.push(item.company_name);
      if (item.date_of_production) details.push(item.date_of_production);
      
      if (details.length > 0) {
        addText(details.join(' • '), margin + 0.15, yPosition);
        yPosition += lineHeight - 0.02;
      }

      yPosition += 0.1;
    });
    yPosition += 0.1;
  }

  // ==========================================
  // ADDITIONAL CREDITS (Manual entries)
  // ==========================================
  if (manualResumes.length > 0) {
    checkPageBreak(0.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    addText('ADDITIONAL CREDITS', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight + 0.05;

    manualResumes.forEach((item) => {
      checkPageBreak(0.6);
      
      // Show title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const showTitle = item.show_name || 'Untitled Production';
      addText(showTitle, margin, yPosition);
      yPosition += lineHeight;

      // Role
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      const role = item.role || 'Role not specified';
      addText(role, margin + 0.15, yPosition);
      yPosition += lineHeight - 0.02;

      // Company and date
      doc.setFont('helvetica', 'normal');
      const details = [];
      if (item.company_name) details.push(item.company_name);
      if (item.date_of_production) details.push(item.date_of_production);
      
      if (details.length > 0) {
        addText(details.join(' • '), margin + 0.15, yPosition);
        yPosition += lineHeight - 0.02;
      }

      yPosition += 0.1;
    });
  }

  // ==========================================
  // FOOTER
  // ==========================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);

  const footerText = branding?.footer?.text || 'Generated via Belong Here Theater';
  addText(
    footerText,
    pageWidth / 2,
    pageHeight - 0.4,
    { align: 'center' }
  );

  // ==========================================
  // SAVE PDF
  // ==========================================
  const fileName = `${fullName.replace(/\s+/g, '_')}_Resume.pdf`;
  doc.save(fileName);
}
