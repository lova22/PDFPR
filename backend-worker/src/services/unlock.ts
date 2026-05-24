import { spawn } from "child_process";
import * as path from "path";

export async function unlockPdf(inputPath: string, outputPath: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "unlock_pdf.py");
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
        if (stdoutData.includes("ERROR: Invalid password")) {
          reject(new Error("Invalid password provided."));
        } else {
          reject(new Error(`Unlock PDF failed. Code: ${code}. Output: ${stdoutData}. Error: ${stderrData}`));
        }
      }
    });
  });
}
