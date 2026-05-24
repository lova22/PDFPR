"use server";

import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const htmlToPdfQueue = new Queue('pdf-jobs', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export async function queueHtmlToPdfJob(
  userId: string,
  fileName: string,
  fileUrl: string
) {
  try {
    const jobId = uuidv4();

    // Insert record into Supabase user_jobs table
    const { error: dbError } = await supabase.from('user_jobs').insert({
      id: jobId,
      user_id: userId,
      job_type: 'html-to-pdf',
      status: 'pending',
      original_file_name: fileName,
      file_url: fileUrl,
      result_url: null,
      error_message: null,
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      throw new Error(`Failed to create job record: ${dbError.message}`);
    }

    // Add job to BullMQ
    await htmlToPdfQueue.add(
      'html-to-pdf',
      {
        jobId,
        userId,
        fileUrl,
        fileName,
      },
      { jobId } // Use the same ID for BullMQ job
    );

    return { jobId, success: true };
  } catch (error: any) {
    console.error('Queue job error:', error);
    return { success: false, error: error.message };
  }
}
