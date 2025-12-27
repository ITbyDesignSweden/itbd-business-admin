-- Migration: Create secure storage bucket for AI chat attachments
-- Sprint 5: The Multimodal Eye
-- Created: 2025-01-27
-- Purpose: Enable file upload for AI Architect with strict GDPR compliance

-- ========================================
-- 1. CREATE STORAGE BUCKET
-- ========================================
-- Create private bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false, -- PRIVATE (not public)
  10485760, -- 10MB limit per file
  ARRAY[
    -- BILDER
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    
    -- DOKUMENT & DATA
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    
    -- NYTT: MICROSOFT OFFICE SUPPORT
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx (Excel)
    'application/vnd.ms-excel',                                          -- .xls  (Gammal Excel)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx (Word)
    'application/msword'                                                   -- .doc  (Gammal Word)
  ]
)
ON CONFLICT (id) DO UPDATE 
SET allowed_mime_types = EXCLUDED.allowed_mime_types; -- Uppdatera om den redan finns

-- ========================================
-- 2. RLS POLICIES FOR STORAGE
-- ========================================
-- Policy 1: INSERT - Only authenticated admins can upload to chat-attachments
CREATE POLICY "Admins can upload files to chat-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  public.is_admin()
);

-- Policy 2: SELECT - Only authenticated admins can read files
CREATE POLICY "Admins can read files from chat-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  public.is_admin()
);

-- Policy 3: DELETE - Only authenticated admins can delete files
CREATE POLICY "Admins can delete files from chat-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  public.is_admin()
);

-- ========================================
-- 3. CLEANUP FUNCTION (GDPR Compliance)
-- ========================================
-- Function to delete files older than 24 hours
-- This should be called by a scheduled Edge Function (see /supabase/functions/cleanup-chat-files/)

CREATE OR REPLACE FUNCTION cleanup_old_chat_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_file RECORD;
BEGIN
  -- Find all files older than 24 hours in chat-attachments bucket
  FOR old_file IN 
    SELECT id, name, bucket_id
    FROM storage.objects
    WHERE bucket_id = 'chat-attachments'
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Delete the file
    DELETE FROM storage.objects
    WHERE id = old_file.id;
    
    RAISE NOTICE 'Deleted old file: % from bucket: %', old_file.name, old_file.bucket_id;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION cleanup_old_chat_attachments() TO authenticated;

-- ========================================
-- 4. VERIFICATION QUERIES (for manual testing)
-- ========================================
-- Uncomment to verify setup:
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
-- SELECT * FROM storage.objects WHERE bucket_id = 'chat-attachments';

