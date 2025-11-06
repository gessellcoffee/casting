import jsPDF from 'jspdf';
import type { Profile, UserResume } from '@/lib/supabase/types';

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

export async function generateResumePDF(data: PDFResumeData): Promise<void> {
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
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.3;

  // ==========================================
  // BIO / DESCRIPTION
  // ==========================================
  if (profile.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    addText('ABOUT', margin, yPosition);
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
  if (profile.skills && profile.skills.length > 0) {
    checkPageBreak(0.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    addText('SKILLS', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const skillsText = profile.skills.join(' • ');
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
    addText('CASTING HISTORY', margin, yPosition);
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
    addText('ADDITIONAL CREDITS', margin, yPosition);
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
  addText(
    'Generated via Belong Here Theater',
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
