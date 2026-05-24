import { convertWordToPdf } from './libreoffice';

/**
 * Converts an HTML file to a PDF using LibreOffice headless mode.
 * (LibreOffice automatically detects HTML format and outputs PDF).
 */
export async function convertHtmlToPdf(inputPath: string, outputDir: string): Promise<string> {
  // convertWordToPdf runs `soffice --headless --convert-to pdf` which handles HTML.
  return convertWordToPdf(inputPath, outputDir);
}
