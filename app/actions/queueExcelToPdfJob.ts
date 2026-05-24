"use server";

import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

const pdfQueue = new Queue('pdf-heavy-jobs', {
  connection: {
    url: REDIS_URL,
  }
});

export async function queueExcelToPdfJob(
  originalStoragePath: string,
) {
  try {
    const jobId = uuidv4();
    const userId = originalStoragePath.split('/')[0];

    const { error: dbError } = await supabase
      .from('user_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        job_type: 'compress', // Placeholder to pass DB constraint
        status: 'pending',
        file_count: 1,
        total_size_bytes: 1000,
      });

    if (dbError) throw new Error(`Failed to create job record: ${dbError.message}`);

    await pdfQueue.add('excel-to-pdf', {
      jobId,
      userId,
      originalFilePath: originalStoragePath,
    });

    return { success: true, jobId };
  } catch (error: any) {
    console.error("Queue Excel to PDF Error:", error);
    return { success: false, error: error.message };
  }
}
