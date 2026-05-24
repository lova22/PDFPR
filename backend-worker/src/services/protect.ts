import { spawn } from "child_process";
import * as path from "path";

export async function protectPdf(inputPath: string, outputPath: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "protect_pdf.py");
    // Depending on the OS, the command is 'python3' or 'python'.
    // We try 'python3' first, if we're in Docker it's python3. On Windows it might be python.
    const isWin = process.platform === "win32";
    const pythonCmd = isWin ? "python" : "python3";
    
    const pyProcess = spawn(pythonCmd, [pythonScript, inputPath, outputPath, password]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code === 0 && stdoutData.includes("SUCCESS")) {
        resolve();
      } else {
        reject(new Error(`Protect PDF failed. Code: ${code}. Output: ${stdoutData}. Error: ${stderrData}`));
      }
    });
  });
}
