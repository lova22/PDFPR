import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Converts a PDF document to Word (DOCX) using Python's pdf2docx.
 * @param inputPath Absolute path to the input PDF file
 * @param outputDir Directory where the output DOCX should be saved
 * @returns The absolute path to the generated DOCX
 */
export async function convertPdfToWord(inputPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file does not exist: ${inputPath}`));
    }

    if (!fs.existsSync(outputDir)) {
      return reject(new Error(`Output directory does not exist: ${outputDir}`));
    }

    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${basename}.docx`);

    const scriptPath = path.join(__dirname, 'convert_pdf_to_docx.py');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    const args = [
      scriptPath,
      inputPath,
      outputPath
    ];

    const pyProcess = spawn(pythonCommand, args);

    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => {
      console.log(`[pdf2docx] ${data.toString().trim()}`);
    });

    pyProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`Failed to start Python process: spawn ${pythonCommand} ENOENT. Please ensure Python is installed and added to your system PATH.`));
      } else {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      }
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}. Details: ${errorOutput}`));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error(`Python script completed but output file was not found at ${outputPath}`));
      }

      resolve(outputPath);
    });
  });
}
