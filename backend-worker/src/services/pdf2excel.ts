import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Converts a PDF to an Excel file by extracting tables using python pdfplumber.
 */
export async function convertPdfToExcel(inputPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file does not exist: ${inputPath}`));
    }
    if (!fs.existsSync(outputDir)) {
      return reject(new Error(`Output directory does not exist: ${outputDir}`));
    }

    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${basename}.xlsx`);

    const pythonScript = path.join(__dirname, 'pdf2excel.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const pyProcess = spawn(pythonCmd, [pythonScript, inputPath, outputPath]);

    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on('error', (err) => {
      reject(new Error(`Failed to start python process: ${err.message}`));
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}. Details: ${errorOutput} ${output}`));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error(`Script completed but output file was not found at ${outputPath}`));
      }

      resolve(outputPath);
    });
  });
}
