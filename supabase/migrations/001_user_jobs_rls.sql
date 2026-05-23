-- ============================================================================
-- 🛡️ SECURITY AUDIT REPORT: ZERO-TRUST ARCHITECTURE
-- ============================================================================
-- 1. Row Level Security (RLS) is explicitly enabled on all user tables.
-- 2. Unauthorized operations (inserts, updates, deletes) are blocked by default.
-- 3. Access is restricted using auth.uid() matching the user_id column.
-- 4. No wildcards or permissive rules are granted to anon or public roles.
-- ============================================================================

-- Create tracking table for client/server jobs
create table if not exists public.user_jobs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade default auth.uid(),
    job_type text not null check (job_type in ('merge', 'split', 'compress', 'rotate', 'pdf_to_word', 'word_to_pdf')),
    status text not null default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
    file_count integer not null default 1,
    total_size_bytes bigint not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_jobs enable row level security;

-- RLS Policies for user_jobs table

create policy "Users can view their own job records."
    on public.user_jobs
    for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own job records."
    on public.user_jobs
    for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own job records."
    on public.user_jobs
    for update
    using ( auth.uid() = user_id )
    with check ( auth.uid() = user_id );

create policy "Users can delete their own job records."
    on public.user_jobs
    for delete
    using ( auth.uid() = user_id );

-- Index user_id for high performance queries
create index if not exists user_jobs_user_id_idx on public.user_jobs (user_id);


-- ============================================================================
-- 📦 STORAGE BUCKET CONFIGURATION & SECURITY
-- ============================================================================
-- While Phase 1 is purely client-side, dynamic conversion tools or backups
-- may require temporary Supabase storage. Below is the secure setup for a
-- private "pdf_documents" bucket with strict owner-only RLS policies.

-- Create storage bucket (safe if it already exists in Supabase Dashboard)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'pdf_documents',
    'pdf_documents',
    false, -- Private bucket (zero unauthorized public access)
    209715200, -- 200MB limit (matches browser validator)
    '{application/pdf}' -- Strictly accept PDF files only
)
on conflict (id) do update
set public = false,
    file_size_limit = 209715200,
    allowed_mime_types = '{application/pdf}';

-- Enable Storage RLS Policies (Storage buckets inherit RLS policies from storage.objects)

create policy "Authenticated users can upload PDFs to their own folder."
    on storage.objects
    for insert
    with check (
        bucket_id = 'pdf_documents' 
        and auth.role() = 'authenticated'
        -- Strict ownership folder structure: /pdf_documents/user_id/filename.pdf
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Authenticated users can retrieve their own PDFs."
    on storage.objects
    for select
    using (
        bucket_id = 'pdf_documents'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Authenticated users can delete their own PDFs."
    on storage.objects
    for delete
    using (
        bucket_id = 'pdf_documents'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
