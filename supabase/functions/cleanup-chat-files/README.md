# Cleanup Chat Files - Edge Function

**Sprint:** 5 - The Multimodal Eye  
**Purpose:** GDPR compliance - Automatically delete chat attachments older than 24 hours  
**Schedule:** Daily via Supabase Cron

## Setup Instructions

### 1. Deploy the Function

```bash
supabase functions deploy cleanup-chat-files
```

### 2. Configure Cron Job (Supabase Dashboard)

1. Go to **Database > Extensions**
2. Enable `pg_cron` extension
3. Go to **Database > Functions** (or use SQL Editor)
4. Run the following SQL to schedule daily cleanup:

```sql
-- Schedule function to run daily at 03:00 AM (UTC)
SELECT cron.schedule(
  'cleanup-chat-files-daily',
  '0 3 * * *', -- Cron expression: Every day at 3 AM
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-chat-files',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_ANON_KEY',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your anon/public key (found in Project Settings > API)

### 3. Verify Cron Job

```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### 4. Manual Testing

You can manually trigger the function to test it:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-chat-files' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## How It Works

1. **Runs daily** at 3 AM UTC
2. **Lists all files** in `chat-attachments` bucket
3. **Filters files** created more than 24 hours ago
4. **Deletes old files** using Storage API
5. **Returns summary** of deleted files

## Security

- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (files belong to different users)
- Only accessible via Supabase Cron or with valid Authorization header
- Respects storage bucket configuration

## Monitoring

Check Edge Function logs in Supabase Dashboard:
- **Edge Functions > cleanup-chat-files > Logs**
- Look for: "Successfully deleted X old files"

