import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Converts a Word document to PDF using LibreOffice in headless mode.
 * @param inputPath Absolute path to the input Word file (.doc or .docx)
 * @param outputDir Directory where the output PDF should be saved
 * @returns The absolute path to the generated PDF
 */
export async function convertWordToPdf(inputPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file does not exist: ${inputPath}`));
    }

    if (!fs.existsSync(outputDir)) {
      return reject(new Error(`Output directory does not exist: ${outputDir}`));
    }

    // LibreOffice command requires just 'soffice' on Linux, sometimes 'soffice.exe' on Windows.
    // For MacOS it would be '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    const sofficeCommand = process.platform === 'win32' ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe' : 'soffice';

    const args = [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputPath
    ];

    const loProcess = spawn(sofficeCommand, args);

    let errorOutput = '';

    loProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    loProcess.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`Failed to start LibreOffice process: spawn ${sofficeCommand} ENOENT. Please ensure LibreOffice is installed and added to your system PATH.`));
      } else {
        reject(new Error(`Failed to start LibreOffice process: ${err.message}`));
      }
    });

    loProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`LibreOffice exited with code ${code}. Details: ${errorOutput}`));
      }

      // LibreOffice saves the file with the same basename but .pdf extension
      const basename = path.basename(inputPath, path.extname(inputPath));
      const expectedOutputPath = path.join(outputDir, `${basename}.pdf`);

      if (!fs.existsSync(expectedOutputPath)) {
        return reject(new Error(`LibreOffice completed but output file was not found at ${expectedOutputPath}`));
      }

      resolve(expectedOutputPath);
    });
  });
}
