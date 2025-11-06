/**
 * Resume Parser Utility
 * Parses theater resumes from PDF and Word documents
 * Extracts show name, role, and company information
 */

export interface ParsedResumeEntry {
  show_name: string;
  role_name: string;
  company: string;
  year?: number;
}

export interface ParseResult {
  success: boolean;
  entries: ParsedResumeEntry[];
  errors: string[];
  rawText?: string;
}

/**
 * Parse structured theater resume text
 * Supports formats:
 * - "SHOW | ROLE | COMPANY"
 * - "SHOW, ROLE, COMPANY"
 * - "SHOW - ROLE - COMPANY"
 * - Tab-separated values
 */
export function parseStructuredResume(text: string): ParseResult {
  const entries: ParsedResumeEntry[] = [];
  const errors: string[] = [];

  // Split into lines
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // Common separators: |, tab, comma, dash
  const separatorPatterns = [
    /\|/,           // Pipe separator
    /\t/,           // Tab separator
    /,(?=\s*[A-Z])/, // Comma followed by capital letter
    /\s+-\s+/,      // Dash with spaces
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines
    if (isHeaderLine(line)) {
      continue;
    }

    // Try each separator pattern
    let parsed = false;
    for (const pattern of separatorPatterns) {
      const parts = line.split(pattern).map(p => p.trim()).filter(Boolean);
      
      // We need at least show and role (company is optional)
      if (parts.length >= 2) {
        const entry: ParsedResumeEntry = {
          show_name: cleanText(parts[0]),
          role_name: cleanText(parts[1]),
          company: parts.length >= 3 ? cleanText(parts[2]) : '',
        };

        // Try to extract year if present
        const year = extractYear(line);
        if (year) {
          entry.year = year;
        }

        // Validate entry
        if (isValidEntry(entry)) {
          entries.push(entry);
          parsed = true;
          break;
        }
      }
    }

    // If line wasn't parsed and looks like it should be, add error
    if (!parsed && looksLikeResumeEntry(line)) {
      errors.push(`Could not parse line ${i + 1}: "${line}"`);
    }
  }

  return {
    success: entries.length > 0,
    entries,
    errors,
    rawText: text,
  };
}

/**
 * Check if line is a header (skip these)
 */
function isHeaderLine(line: string): boolean {
  const headerPatterns = [
    /^(show|role|company|production|theater|theatre)/i,
    /^-+$/,  // Dashes
    /^=+$/,  // Equal signs
    /^\*+$/, // Asterisks
  ];

  return headerPatterns.some(pattern => pattern.test(line));
}

/**
 * Check if line looks like a resume entry
 */
function looksLikeResumeEntry(line: string): boolean {
  // Should have some length
  if (line.length < 5) return false;
  
  // Should not be all caps (likely a section header)
  if (line === line.toUpperCase() && line.length < 30) return false;
  
  // Should have at least one separator or multiple words
  const hasSeparator = /[|,\t-]/.test(line);
  const hasMultipleWords = line.split(/\s+/).length >= 2;
  
  return hasSeparator || hasMultipleWords;
}

/**
 * Extract year from text (e.g., "2023", "(2023)", "2023-2024")
 */
function extractYear(text: string): number | undefined {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }
  return undefined;
}

/**
 * Clean text (remove extra whitespace, quotes, etc.)
 */
function cleanText(text: string): string {
  return text
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validate that entry has required fields
 */
function isValidEntry(entry: ParsedResumeEntry): boolean {
  return (
    entry.show_name.length > 0 &&
    entry.role_name.length > 0 &&
    entry.show_name.length < 200 && // Sanity check
    entry.role_name.length < 200
  );
}

/**
 * Parse resume from common table formats
 * Handles tables with headers like:
 * Show Name | Role | Company
 * -------------------------
 * Hamilton  | Ensemble | Broadway
 */
export function parseTableFormat(text: string): ParseResult {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const entries: ParsedResumeEntry[] = [];
  const errors: string[] = [];

  let headerFound = false;
  let separatorIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for header row
    if (!headerFound && /show|role|production/i.test(line)) {
      headerFound = true;
      // Find separator positions (|, tab, or multiple spaces)
      const parts = line.split(/[|\t]|  +/);
      separatorIndices = parts.map((_, idx) => idx);
      continue;
    }

    // Skip separator lines
    if (/^[-=*]+$/.test(line)) {
      continue;
    }

    // Parse data rows
    if (headerFound || separatorIndices.length > 0) {
      const parts = line.split(/[|\t]|  +/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length >= 2) {
        const entry: ParsedResumeEntry = {
          show_name: cleanText(parts[0]),
          role_name: cleanText(parts[1]),
          company: parts.length >= 3 ? cleanText(parts[2]) : '',
        };

        const year = extractYear(line);
        if (year) entry.year = year;

        if (isValidEntry(entry)) {
          entries.push(entry);
        }
      }
    }
  }

  return {
    success: entries.length > 0,
    entries,
    errors,
    rawText: text,
  };
}

/**
 * Smart parser that tries multiple strategies
 */
export function parseResume(text: string): ParseResult {
  // Try table format first
  const tableResult = parseTableFormat(text);
  if (tableResult.success && tableResult.entries.length > 0) {
    return tableResult;
  }

  // Fall back to structured format
  const structuredResult = parseStructuredResume(text);
  if (structuredResult.success && structuredResult.entries.length > 0) {
    return structuredResult;
  }

  // If both failed, return the one with more info
  if (structuredResult.errors.length > 0) {
    return structuredResult;
  }

  return {
    success: false,
    entries: [],
    errors: ['Could not parse resume. Please ensure it follows a structured format.'],
    rawText: text,
  };
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validate file type
 */
export function isValidResumeFile(file: File): boolean {
  const validTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];
  
  const validExtensions = ['.txt', '.pdf', '.docx', '.doc'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
}

/**
 * Get file type display name
 */
export function getFileTypeName(file: File): string {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  switch (extension) {
    case '.pdf':
      return 'PDF';
    case '.docx':
    case '.doc':
      return 'Word Document';
    case '.txt':
      return 'Text File';
    default:
      return 'Unknown';
  }
}
