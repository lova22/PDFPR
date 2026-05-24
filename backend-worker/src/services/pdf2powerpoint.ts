import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Converts a PDF to PowerPoint using LibreOffice.
 */
export async function convertPdfToPowerpoint(inputPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file does not exist: ${inputPath}`));
    }

    if (!fs.existsSync(outputDir)) {
      return reject(new Error(`Output directory does not exist: ${outputDir}`));
    }

    const sofficeCommand = process.platform === 'win32' ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe' : 'soffice';

    const args = [
      '--infilter=impress_pdf_import',
      '--headless',
      '--convert-to', 'pptx',
      '--outdir', outputDir,
      inputPath
    ];

    const loProcess = spawn(sofficeCommand, args);

    let errorOutput = '';

    loProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    loProcess.on('error', (err: any) => {
      reject(new Error(`Failed to start LibreOffice process: ${err.message}`));
    });

    loProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`LibreOffice exited with code ${code}. Details: ${errorOutput}`));
      }

      const basename = path.basename(inputPath, path.extname(inputPath));
      const expectedOutputPath = path.join(outputDir, `${basename}.pptx`);

      if (!fs.existsSync(expectedOutputPath)) {
        return reject(new Error(`LibreOffice completed but output file was not found at ${expectedOutputPath}`));
      }

      resolve(expectedOutputPath);
    });
  });
}
