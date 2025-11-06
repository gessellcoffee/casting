/**
 * DOCX Parser Utility
 * Extracts text from Word documents using mammoth
 */

// Note: mammoth requires installation: npm install mammoth
// For now, this is a placeholder that will work once the package is installed

export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Dynamic import to avoid bundling if not used
    const mammoth = await import('mammoth');
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to extract text from Word document.');
  }
}

/**
 * Check if DOCX parsing is available
 */
export function isDOCXParsingAvailable(): boolean {
  try {
    require.resolve('mammoth');
    return true;
  } catch {
    return false;
  }
}
