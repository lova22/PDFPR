import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { compressPdf, repairPdf } from './services/ghostscript';
import { convertWordToPdf } from './services/libreoffice';
import { convertPdfToWord } from './services/pdf2docx';
import { protectPdf } from './services/protect';
import { unlockPdf } from './services/unlock';
import { convertPdfToExcel } from './services/pdf2excel';
import { convertPdfToPowerpoint } from './services/pdf2powerpoint';
import { convertHtmlToPdf } from './services/html2pdf';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables! Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

// 1. Connect to Redis
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// 2. Initialize Supabase Client with Service Role Key (Bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

console.log("Starting backend worker...");
console.log("Redis and Supabase initialized.");

interface PdfJobData {
  jobId: string;
  userId: string;
  originalFilePath: string; // The path in the Supabase storage bucket
  password?: string; // For protect/unlock jobs
}

// 3. Setup BullMQ Worker
const worker = new Worker('pdf-heavy-jobs', async (job: Job) => {
  console.log(`\n[WORKER] Received job [${job.id}] of type [${job.name}]`);
  console.log(`[WORKER] Job Data:`, job.data);
  
  if (!['compress-pdf', 'word-to-pdf', 'pdf-to-word', 'protect-pdf', 'unlock-pdf', 'excel-to-pdf', 'powerpoint-to-pdf', 'pdf-to-excel', 'pdf-to-powerpoint', 'repair-pdf', 'html-to-pdf'].includes(job.name)) {
    throw new Error(`Unknown job type: ${job.name}`);
  }

  const { jobId, userId, originalFilePath, password } = job.data as PdfJobData;

  const tmpDir = os.tmpdir();
  const originalExt = path.extname(originalFilePath) || '.pdf';
  const inputFileName = `input-${job.id}-${Date.now()}${originalExt}`;
  const outputFileName = `output-${job.id}-${Date.now()}.pdf`;
  const localInputPath = path.join(tmpDir, inputFileName);
  const localOutputPath = path.join(tmpDir, outputFileName);
  
  try {
    // Step A: Download
    console.log(`[WORKER] Downloading file from storage: ${originalFilePath}`);
    // Assume bucket is named 'pdf_documents'
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf_documents')
      .download(originalFilePath);
      
    if (downloadError || !fileData) {
      throw new Error(`Download failed: ${downloadError?.message}`);
    }
    
    // Save locally
    const arrayBuffer = await fileData.arrayBuffer();
    fs.writeFileSync(localInputPath, Buffer.from(arrayBuffer));
    console.log(`[WORKER] File downloaded locally to ${localInputPath}`);

    let resultFilePath = '';

    // Step B: Process based on Job Type
    if (job.name === 'compress-pdf') {
      console.log(`[WORKER] Running Ghostscript compression...`);
      await compressPdf(localInputPath, localOutputPath);
      console.log(`[WORKER] Compression complete.`);
      resultFilePath = localOutputPath;
    } else if (job.name === 'word-to-pdf' || job.name === 'excel-to-pdf' || job.name === 'powerpoint-to-pdf') {
      console.log(`[WORKER] Running LibreOffice conversion for ${job.name}...`);
      // LibreOffice generates its own output file name in the specified dir
      resultFilePath = await convertWordToPdf(localInputPath, tmpDir);
      console.log(`[WORKER] Conversion complete. Output: ${resultFilePath}`);
    } else if (job.name === 'pdf-to-word') {
      console.log(`[WORKER] Running pdf2docx conversion...`);
      resultFilePath = await convertPdfToWord(localInputPath, tmpDir);
      console.log(`[WORKER] Conversion complete. Output: ${resultFilePath}`);
    } else if (job.name === 'pdf-to-excel') {
      console.log(`[WORKER] Running pdfplumber conversion to Excel...`);
      resultFilePath = await convertPdfToExcel(localInputPath, tmpDir);
      console.log(`[WORKER] Conversion complete. Output: ${resultFilePath}`);
    } else if (job.name === 'pdf-to-powerpoint') {
      console.log(`[WORKER] Running LibreOffice conversion to PowerPoint...`);
      resultFilePath = await convertPdfToPowerpoint(localInputPath, tmpDir);
      console.log(`[WORKER] Conversion complete. Output: ${resultFilePath}`);
    } else if (job.name === 'protect-pdf') {
      if (!password) throw new Error("Password is required for protect-pdf job");
      console.log(`[WORKER] Running pypdf protection...`);
      resultFilePath = localOutputPath;
      await protectPdf(localInputPath, localOutputPath, password);
      console.log(`[WORKER] Protection complete.`);
    } else if (job.name === 'unlock-pdf') {
      if (!password) throw new Error("Password is required for unlock-pdf job");
      console.log(`[WORKER] Running pypdf unlock...`);
      resultFilePath = localOutputPath;
      await unlockPdf(localInputPath, localOutputPath, password);
      console.log(`[WORKER] Unlock complete.`);
    } else if (job.name === 'repair-pdf') {
      console.log(`[WORKER] Running Ghostscript repair...`);
      await repairPdf(localInputPath, localOutputPath);
      console.log(`[WORKER] Repair complete.`);
      resultFilePath = localOutputPath;
    } else if (job.name === 'html-to-pdf') {
      console.log(`[WORKER] Running HTML to PDF conversion...`);
      const htmlInputPath = path.join(tmpDir, 'input.html');
      fs.renameSync(localInputPath, htmlInputPath);
      resultFilePath = await convertHtmlToPdf(htmlInputPath, tmpDir);
      console.log(`[WORKER] Conversion complete. Output: ${resultFilePath}`);
    }
    
    // Step C: Upload
    const processedBuffer = fs.readFileSync(resultFilePath);
    const resultExt = path.extname(resultFilePath) || (job.name === 'pdf-to-word' ? '.docx' : '.pdf');
    const processedStoragePath = `${userId}/processed-${path.basename(originalFilePath, path.extname(originalFilePath))}-${job.name}${resultExt}`;
    
    console.log(`[WORKER] Uploading processed file to: ${processedStoragePath}`);
    const { error: uploadError } = await supabase.storage
      .from('pdf_documents')
      .upload(processedStoragePath, processedBuffer, {
        contentType: resultExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Step D: Database Sync
    console.log(`[WORKER] Updating job status in database...`);
    const { error: dbError } = await supabase
      .from('user_jobs')
      .update({ 
        status: 'completed', 
        result_file_path: processedStoragePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (dbError) {
      throw new Error(`DB update failed: ${dbError.message}`);
    }
    
    console.log(`[WORKER] Job [${job.id}] completed successfully.`);
    return { success: true, processedFilePath: processedStoragePath };

  } catch (error: any) {
    console.error(`[WORKER] Error processing job [${job.id}]:`, error.message);
    
    // Update Supabase job status to 'failed'
    try {
      await supabase
        .from('user_jobs')
        .update({ 
          status: 'failed', 
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (dbErr) {
      console.error(`[WORKER] Failed to update job status to 'failed':`, dbErr);
    }
    
    throw error; // Re-throw for BullMQ
  } finally {
    // Disk Cleanup
    console.log(`[WORKER] Cleaning up local files...`);
    if (fs.existsSync(localInputPath)) {
      try {
        fs.unlinkSync(localInputPath);
      } catch (e) {
        console.error(`[WORKER] Failed to delete local input file:`, e);
      }
    }
    if (fs.existsSync(localOutputPath)) {
      try {
        fs.unlinkSync(localOutputPath);
      } catch (e) {
        console.error(`[WORKER] Failed to delete local output file:`, e);
      }
    }
  }
}, { connection });

worker.on('completed', (job) => {
  console.log(`[BULLMQ] Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`[BULLMQ] Job ${job?.id} has failed with error: ${err.message}`);
});
