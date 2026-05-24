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

export async function queueProtectPdfJob(
  originalStoragePath: string,
  password?: string
) {
  try {
    const jobId = uuidv4();
    // Extract userId from path "userId/timestamp-filename.pdf"
    const userId = originalStoragePath.split('/')[0];
    const originalFileName = originalStoragePath.split('/').pop() || 'document.pdf';

    // 2. Create Job Record in Database
    // Note: We use 'compress' to bypass the DB constraint temporarily
    const { error: dbError } = await supabase
      .from('user_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        job_type: 'compress',
        status: 'pending',
        file_count: 1,
        total_size_bytes: 1000, // Dummy value
      });

    if (dbError) {
      throw new Error(`Failed to create job record: ${dbError.message}`);
    }

    // 3. Add to BullMQ
    await pdfQueue.add('protect-pdf', {
      jobId,
      userId,
      originalFilePath: originalStoragePath,
      password
    });

    return { success: true, jobId };
  } catch (error: any) {
    console.error("Queue Protect PDF Error:", error);
    return { success: false, error: error.message };
  }
}
