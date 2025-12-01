/**
 * PDF Parser Utility
 * Extracts text from PDF files using pdf-parse
 */

// Note: pdf-parse requires installation: npm install pdf-parse
// For now, this is a placeholder that will work once the package is installed

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import - pdf-parse exports as both default and named
    const pdfParseModule = await import('pdf-parse');
    // @ts-expect-error - pdf-parse has inconsistent type definitions between CJS and ESM
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    // Parse PDF
    const data = await pdfParse(buffer);
    
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the PDF contains selectable text.');
  }
}

/**
 * Check if PDF parsing is available
 */
export function isPDFParsingAvailable(): boolean {
  try {
    require.resolve('pdf-parse');
    return true;
  } catch {
    return false;
  }
}
