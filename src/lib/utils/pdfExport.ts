import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatUSDate, formatUSTime } from './dateUtils';

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

/**
 * Generate a PDF calendar in grid format (monthly view)
 */
export function generateCalendarGridPDF(
  events: CalendarEvent[],
  showDetails: ShowDetails,
  actorName: string,
  format: 'actor' | 'production' = 'actor'
): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'letter') as jsPDFWithPlugin;
  
  // Header
  doc.setFillColor(107, 141, 214); // Blue accent
  doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(showDetails.title, 15, 12);
  
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
    doc.setTextColor(107, 141, 214);
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
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [107, 141, 214],
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
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${(new Date().toDateString())}`,
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
  format: 'actor' | 'production' = 'actor'
): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'letter') as jsPDFWithPlugin;
  
  // Header
  doc.setFillColor(107, 141, 214);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(showDetails.title, 15, 12);
  
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
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Event box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, yPosition, doc.internal.pageSize.width - 30, 35, 3, 3, 'FD');
    
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
    doc.text(`📅 ${formatUSDate(event.date)}`, 20, yPosition + 18);
    
    if (event.time) {
      doc.text(`🕐 ${event.time}`, 20, yPosition + 23);
    }
    
    if (event.location) {
      doc.text(`📍 ${event.location}`, 20, yPosition + 28);
    }
    
    if (format === 'production' && event.description) {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(event.description, doc.internal.pageSize.width - 45);
      doc.text(lines, 20, yPosition + 33);
    }
    
    yPosition += 40;
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${formatUSDate(new Date().toISOString())}`,
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
export function generateCallSheetPDF(
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
      status: string;
    }>;
  }>
): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'letter') as jsPDFWithPlugin;
  
  // Title
  doc.setFillColor(107, 141, 214);
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
  
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 50;
  
  // Rehearsal Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REHEARSAL DETAILS', 15, yPosition);
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
  doc.text('AGENDA', 15, yPosition);
  yPosition += 8;
  
  agendaItems.forEach((item, index) => {
    // Check for page break
    if (yPosition > 240) {
      doc.addPage();
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
        cast.status
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Name', 'Role', 'Email', 'Phone', 'Status']],
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
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${formatUSDate(new Date().toISOString())} at ${formatUSTime(new Date().toTimeString().split(' ')[0])}`,
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
