import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatUSDate, formatUSTime } from './dateUtils';
import type { PdfBrandingConfig, PdfAccent } from '@/lib/supabase/types';

// Define types for jsPDF with autoTable plugin
type jsPDFWithPlugin = jsPDF & {
  lastAutoTable: { finalY: number };
};

export interface CalendarEvent {
  date: string;
  title: string;
  type: string;
  time?: string;
  location?: string;
  description?: string;
  color?: string;
}

export interface ShowDetails {
  title: string;
  author?: string;
  roleName?: string;
  isUnderstudy?: boolean;
  workflowStatus?: string;
}

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

const resolveBrandingAccentRgb = (branding?: PdfBrandingConfig) => {
  const customAccentHex = typeof branding?.accent_hex === 'string' ? branding.accent_hex.trim() : '';
  const isValidCustomAccent = /^#[0-9a-fA-F]{6}$/.test(customAccentHex);
  const accentHex = isValidCustomAccent ? customAccentHex : resolveAccentHex(branding?.accent);
  return hexToRgb(accentHex) || { r: 107, g: 141, b: 214 };
};

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

const applyWatermarkToCurrentPage = async (doc: jsPDF, branding?: PdfBrandingConfig) => {
  if (!branding?.watermark || branding.watermark.type === 'none') return;

  try {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

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
        const format = getImageFormatFromDataUrl(dataUrl);
        if (format) {
          const w = Math.min(100, pageWidth * 0.35);
          const h = w;
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
};

/**
 * Generate a PDF calendar in grid format (monthly view)
 */
export function generateCalendarGridPDF(
  events: CalendarEvent[],
  showDetails: ShowDetails,
  actorName: string,
  format: 'actor' | 'production' = 'actor',
  branding?: PdfBrandingConfig
): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'letter') as jsPDFWithPlugin;
  const accentRgb = resolveBrandingAccentRgb(branding);
  void applyWatermarkToCurrentPage(doc, branding);
  
  // Header
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(showDetails.title, 15, 12);

  if (branding?.logo?.url) {
    void (async () => {
      const dataUrl = await loadImageAsDataUrl(branding.logo!.url);
      if (!dataUrl) return;
      const format = getImageFormatFromDataUrl(dataUrl);
      if (!format) return;
      const logoSize = 12;
      const logoX = branding.logo!.placement === 'header_right'
        ? doc.internal.pageSize.width - 15 - logoSize
        : 15;
      const logoY = (25 - logoSize) / 2;
      try {
        doc.addImage(dataUrl, format, logoX, logoY, logoSize, logoSize);
      } catch {
        // ignore
      }
    })();
  }
  
  if (showDetails.author) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`by ${showDetails.author}`, 15, 19);
  }
  
  // Actor/Role info on right
  if (format === 'actor' && showDetails.roleName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const roleText = showDetails.isUnderstudy 
      ? `Understudy - ${showDetails.roleName}`
      : showDetails.roleName;
    doc.text(roleText, doc.internal.pageSize.width - 15, 12, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(actorName, doc.internal.pageSize.width - 15, 18, { align: 'right' });
  }
  
  doc.setTextColor(0, 0, 0);
  
  // Group events by month
  const eventsByMonth = groupEventsByMonth(events);
  
  let yPosition = 35;
  
  Object.entries(eventsByMonth).forEach(([monthYear, monthEvents], index) => {
    // Check if we need a new page
    if (yPosition > 170 && index > 0) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Month header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text(monthYear, 15, yPosition);
    yPosition += 8;
    
    doc.setTextColor(0, 0, 0);
    
    // Create calendar grid
    const tableData = monthEvents.map(event => {
      const row = [
        formatUSDate(event.date),
        event.time || 'All Day',
        event.title,
        event.type,
        event.location || 'TBD'
      ];
      
      if (format === 'production' && event.description) {
        row.push(event.description);
      }
      
      return row;
    });
    
    const columns = format === 'production'
      ? ['Date', 'Time', 'Event', 'Type', 'Location', 'Details']
      : ['Date', 'Time', 'Event', 'Type', 'Location'];
    
    autoTable(doc, {
      startY: yPosition,
      head: [columns],
      body: tableData,
      theme: 'grid',
      rowPageBreak: 'avoid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [accentRgb.r, accentRgb.g, accentRgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: format === 'production' ? 40 : 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: format === 'production' ? 30 : 40 },
      },
      didParseCell: (data) => {
        // Color-code by event type
        if (data.section === 'body' && data.column.index === 3) {
          const eventType = data.cell.text[0];
          let bgColor: [number, number, number] = [255, 255, 255];
          
          switch (eventType) {
            case 'Audition':
              bgColor = [90, 143, 245];
              break;
            case 'Callback':
              bgColor = [155, 135, 245];
              break;
            case 'Rehearsal':
              bgColor = [249, 115, 22];
              break;
            case 'Performance':
              bgColor = [239, 68, 68];
              break;
            case 'Agenda Item':
              bgColor = [245, 158, 11];
              break;
            default:
              bgColor = [52, 211, 153];
          }
          
          data.cell.styles.fillColor = bgColor;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;

    // If a new page was added by autotable, apply watermark to that page too
    // (autotable adds pages internally, so we apply watermark after the fact)
    void (async () => {
      const pageCount = (doc.internal.pages?.length || 1) - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        await applyWatermarkToCurrentPage(doc, branding);
      }
    })();
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      branding?.footer?.text || `Generated on ${(new Date().toDateString())}`,
      15,
      doc.internal.pageSize.height - 10
    );  
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Generate a PDF calendar in list format (chronological)
 */
export function generateCalendarListPDF(
  events: CalendarEvent[],
  showDetails: ShowDetails,
  actorName: string,
  format: 'actor' | 'production' = 'actor',
  branding?: PdfBrandingConfig
): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'letter') as jsPDFWithPlugin;
  const accentRgb = resolveBrandingAccentRgb(branding);
  void applyWatermarkToCurrentPage(doc, branding);
  
  // Header
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(showDetails.title, 15, 12);

  if (branding?.logo?.url) {
    void (async () => {
      const dataUrl = await loadImageAsDataUrl(branding.logo!.url);
      if (!dataUrl) return;
      const format = getImageFormatFromDataUrl(dataUrl);
      if (!format) return;
      const logoSize = 10;
      const logoX = branding.logo!.placement === 'header_right'
        ? doc.internal.pageSize.width - 15 - logoSize
        : 15;
      const logoY = (30 - logoSize) / 2;
      try {
        doc.addImage(dataUrl, format, logoX, logoY, logoSize, logoSize);
      } catch {
        // ignore
      }
    })();
  }
  
  if (showDetails.author) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`by ${showDetails.author}`, 15, 18);
  }
  
  if (format === 'actor' && showDetails.roleName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const roleText = showDetails.isUnderstudy 
      ? `Understudy - ${showDetails.roleName}`
      : showDetails.roleName;
    doc.text(roleText, 15, 24);
  }
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 40;
  
  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedEvents.forEach((event, index) => {
    const pageWidth = doc.internal.pageSize.width;
    const cardWidth = pageWidth - 30;
    const baseCardHeight = 35;

    const descriptionLines =
      format === 'production' && event.description
        ? doc.splitTextToSize(event.description, pageWidth - 45)
        : null;

    const descriptionHeight = descriptionLines ? descriptionLines.length * 4 + 2 : 0;
    const cardHeight = baseCardHeight + descriptionHeight;

    // Check if we need a new page
    if (yPosition + cardHeight > 260) {
      doc.addPage();
      void applyWatermarkToCurrentPage(doc, branding);
      yPosition = 20;
    }
    
    // Event box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, yPosition, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Event type badge
    const typeColors: Record<string, [number, number, number]> = {
      'Audition': [90, 143, 245],
      'Callback': [155, 135, 245],
      'Rehearsal': [249, 115, 22],
      'Performance': [239, 68, 68],
      'Agenda Item': [245, 158, 11],
      'default': [52, 211, 153],
    };
    
    const badgeColor = typeColors[event.type] || typeColors.default;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(20, yPosition + 5, 25, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(event.type, 32.5, yPosition + 9, { align: 'center' });
    
    // Event details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(event.title, 50, yPosition + 9);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatUSDate(event.date)}`, 20, yPosition + 18);
    
    if (event.time) {
      doc.text(`Time: ${event.time}`, 20, yPosition + 23);
    }
    
    if (event.location) {
      doc.text(`Location: ${event.location}`, 20, yPosition + 28);
    }
    
    if (descriptionLines) {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(descriptionLines, 20, yPosition + 33);
    }

    yPosition += cardHeight + 5;
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      branding?.footer?.text || `Generated on ${formatUSDate(new Date().toISOString())}`,
      15,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Generate a call sheet PDF for a specific rehearsal
 */
export async function generateCallSheetPDF(
  rehearsalEvent: {
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    notes?: string;
  },
  showDetails: ShowDetails,
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
    }>;
  }>,
  branding?: PdfBrandingConfig
): Promise<jsPDF> {
  const doc = new jsPDF('portrait', 'mm', 'letter') as jsPDFWithPlugin;
  const accentRgb = resolveBrandingAccentRgb(branding);
  await applyWatermarkToCurrentPage(doc, branding);
  
  // Title
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CALL SHEET', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(showDetails.title, doc.internal.pageSize.width / 2, 25, { align: 'center' });
  
  if (showDetails.author) {
    doc.setFontSize(12);
    doc.text(`by ${showDetails.author}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });
  }

  if (branding?.logo?.url) {
    const dataUrl = await loadImageAsDataUrl(branding.logo.url);
    if (dataUrl) {
      const format = getImageFormatFromDataUrl(dataUrl);
      if (format) {
        const logoSize = 14;
        const logoX = branding.logo.placement === 'header_right'
          ? doc.internal.pageSize.width - 15 - logoSize
          : 15;
        const logoY = (40 - logoSize) / 2;
        try {
          doc.addImage(dataUrl, format, logoX, logoY, logoSize, logoSize);
        } catch {
          // ignore
        }
      }
    }
  }
  
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 50;
  
  // Rehearsal Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text('REHEARSAL DETAILS', 15, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatUSDate(rehearsalEvent.date)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Time: ${formatUSTime(rehearsalEvent.start_time)} - ${formatUSTime(rehearsalEvent.end_time)}`, 20, yPosition);
  yPosition += 6;
  
  if (rehearsalEvent.location) {
    doc.text(`Location: ${rehearsalEvent.location}`, 20, yPosition);
    yPosition += 6;
  }
  
  if (rehearsalEvent.notes) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const notesLines = doc.splitTextToSize(`Notes: ${rehearsalEvent.notes}`, doc.internal.pageSize.width - 40);
    doc.text(notesLines, 20, yPosition);
    yPosition += notesLines.length * 5 + 5;
    doc.setTextColor(0, 0, 0);
  }
  
  yPosition += 5;
  
  // Agenda Items
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text('AGENDA', 15, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;

  for (let index = 0; index < agendaItems.length; index++) {
    const item = agendaItems[index];
    // Check for page break
    if (yPosition > 240) {
      doc.addPage();
      await applyWatermarkToCurrentPage(doc, branding);
      yPosition = 20;
    }
    
    // Item header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition - 5, doc.internal.pageSize.width - 30, 8, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatUSTime(item.start_time)} - ${formatUSTime(item.end_time)}`, 20, yPosition);
    doc.text(item.title, 65, yPosition);
    yPosition += 8;
    
    if (item.description) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(item.description, doc.internal.pageSize.width - 50);
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 4 + 2;
      doc.setTextColor(0, 0, 0);
    }
    
    // Cast table
    if (item.assignments.length > 0) {
      const castData = item.assignments.map(cast => [
        `${cast.first_name} ${cast.last_name}`,
        cast.role_name || 'Ensemble',
        cast.email,
        cast.phone || 'N/A',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Name', 'Role', 'Email', 'Phone']],
        body: castData,
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [230, 238, 249],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('No cast assigned', 20, yPosition);
      yPosition += 8;
      doc.setTextColor(0, 0, 0);
    }

  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      branding?.footer?.text || `Generated on ${formatUSDate(new Date().toISOString())} at ${formatUSTime(new Date().toTimeString().split(' ')[0])}`,
      15,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Helper function to group events by month
 */
function groupEventsByMonth(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  
  events.forEach(event => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    
    grouped[monthYear].push(event);
  });
  
  // Sort events within each month
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
  
  return grouped;
}

/**
 * Download a PDF file
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
