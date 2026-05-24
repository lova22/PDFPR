"use server";

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@/lib/supabase/server';

export async function queueWordToPdfJob(originalFilePath: string, totalSizeBytes: number) {
  try {
    const supabase = await createClient();
    
    // Ensure the user is authenticated (anonymous auth via AuthProvider)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Unauthorized. Please ensure you are connected.");
    }
    
    // Insert job into user_jobs table
    const { data: jobRow, error: insertError } = await supabase
      .from('user_jobs')
      .insert({
        user_id: user.id,
        job_type: 'word_to_pdf',
        status: 'pending',
        file_count: 1,
        total_size_bytes: totalSizeBytes,
      })
      .select('id')
      .single();
      
    if (insertError || !jobRow) {
      throw new Error(`Failed to create job record: ${insertError?.message}`);
    }
    
    const jobId = jobRow.id;
    
    // Connect to Redis and dispatch job
    const REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
      throw new Error("REDIS_URL environment variable is missing.");
    }
    
    const connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    
    const workerQueue = new Queue('pdf-heavy-jobs', { connection });
    
    await workerQueue.add('word-to-pdf', {
      jobId,
      userId: user.id,
      originalFilePath
    });
    
    // Clean up connection
    await connection.quit();
    
    return { success: true, jobId };
  } catch (error: any) {
    console.error("Failed to queue Word to PDF job:", error);
    return { success: false, error: error.message };
  }
}
