-- Create Storage Bucket for Pilot Request Uploads
-- This migration sets up a bucket with strict policies:
-- - Anyone can upload files (for public form submissions)
-- - Only authenticated admins can read/download files

-- Create the bucket (not public by default)
insert into storage.buckets (id, name, public)
values ('pilot-uploads', 'pilot-uploads', false)
on conflict (id) do nothing;

-- Policy: Allow anyone to upload files
create policy "Anyone can upload pilot files"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'pilot-uploads');

-- Policy: Only authenticated users (admins) can read files
create policy "Authenticated users can read pilot files"
on storage.objects for select
to authenticated
using (bucket_id = 'pilot-uploads');

-- Policy: Only authenticated users (admins) can delete files
create policy "Authenticated users can delete pilot files"
on storage.objects for delete
to authenticated
using (bucket_id = 'pilot-uploads');

