// Supabase Edge Function: Cleanup Chat Attachments
// Sprint 5: The Multimodal Eye
// Purpose: Delete files older than 24 hours for GDPR compliance
// Schedule: Run daily via Supabase Cron (configure in Dashboard)

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Verify this is called from Supabase Cron (optional security check)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting cleanup of old chat attachments...');

    // Get all files from chat-attachments bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from('chat-attachments')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list files', details: listError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!files || files.length === 0) {
      console.log('No files to clean up');
      return new Response(
        JSON.stringify({ message: 'No files to clean up', deletedCount: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filter files older than 24 hours
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at);
      return createdAt < cutoffTime;
    });

    console.log(`Found ${oldFiles.length} files older than 24 hours`);

    if (oldFiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No old files to delete', deletedCount: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete old files
    const filesToDelete = oldFiles.map(f => f.name);
    const { data: deleteData, error: deleteError } = await supabase
      .storage
      .from('chat-attachments')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete files', details: deleteError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted ${filesToDelete.length} old files`);

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed successfully',
        deletedCount: filesToDelete.length,
        deletedFiles: filesToDelete
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

