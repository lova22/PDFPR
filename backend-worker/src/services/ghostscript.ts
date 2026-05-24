import { spawn } from 'child_process';
import fs from 'fs';

/**
 * Compresses a PDF file using Ghostscript.
 * Uses spawn instead of exec to prevent shell injection.
 * 
 * @param inputPath Absolute path to the original PDF
 * @param outputPath Absolute path where the compressed PDF should be saved
 * @returns Promise that resolves when compression is complete
 */
export const compressPdf = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ensure input file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    // Ghostscript arguments for web-optimized PDF compression
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/screen', // Screen setting is web-optimized (~72 dpi images)
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    // Determine correct executable based on OS
    const gsCommand = process.platform === 'win32' ? 'gswin64c' : 'gs';

    // Use spawn to prevent shell injection vulnerabilities
    const gsProcess = spawn(gsCommand, gsArgs);

    let errorOutput = '';

    gsProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    gsProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Ghostscript exited with code ${code}. Error: ${errorOutput}`));
      }
    });

    gsProcess.on('error', (err) => {
      reject(new Error(`Failed to start Ghostscript process: ${err.message}`));
    });
  });
};

/**
 * Repairs a corrupted PDF file using Ghostscript.
 * Ghostscript rewrites the PDF structure and xref tables.
 */
export const repairPdf = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dPDFSETTINGS=/prepress',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    const gsCommand = process.platform === 'win32' ? 'gswin64c' : 'gs';
    const gsProcess = spawn(gsCommand, gsArgs);

    let errorOutput = '';
    gsProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    gsProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Ghostscript exited with code ${code}. Error: ${errorOutput}`));
    });

    gsProcess.on('error', (err) => {
      reject(new Error(`Failed to start Ghostscript process: ${err.message}`));
    });
  });
};
