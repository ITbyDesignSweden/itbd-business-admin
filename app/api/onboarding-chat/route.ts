import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getActivePrompt as getPromptFromService, PROMPT_TYPES } from '@/lib/ai/prompt-service';
import { createClient } from '@/lib/supabase/server';
import { processAiChatStream } from '@/lib/ai/chat-core';
import { UIMessage } from 'ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface ChatRequestBody {
  messages: UIMessage[];
  orgId: string;
  attachments?: Array<{ name: string; url: string; contentType: string }>;
}

/**
 * API Route for Onboarding SDR Chat
 * Handles: Magic Link Session (via cookies)
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, orgId, attachments }: ChatRequestBody = await req.json();

    console.log('=== Onboarding Chat API Request ===');
    console.log('Org ID:', orgId);
    console.log('Messages count:', messages?.length);
    console.log('Attachments:', attachments?.length || 0);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Serverkonfigurationsfel' }), { status: 500, headers: corsHeaders });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = await createClient();
    
    // 1. Authenticate (Magic Link session)
    const { data: { session } } = await supabaseUser.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Obehörig: Inloggning krävs' }), { status: 401, headers: corsHeaders });
    }

    // 2. Verify Access to this Org (RLS)
    const { data: userOrg } = await supabaseUser.from('organizations').select('id').eq('id', orgId).single();
    if (!userOrg) {
      return new Response(JSON.stringify({ error: 'Obehörig tillgång till denna organisation' }), { status: 403, headers: corsHeaders });
    }

    // 3. Get Data and Prompt
    const { data: org } = await supabaseAdmin.from('organizations_with_credits').select('name, business_profile').eq('id', orgId).single();
    if (!org) return new Response(JSON.stringify({ error: 'Organisation hittades ej' }), { status: 404, headers: corsHeaders });

    const systemPrompt = await getPromptFromService(
      PROMPT_TYPES.SDR_CHAT_SYSTEM,
      { organization_name: org.name, business_profile: org.business_profile || "Okänd verksamhet" },
      `Du är en SDR för IT By Design...`
    );

    // 4. Delegate to Core
    return processAiChatStream({
      messages,
      mode: 'sdr',
      orgName: org.name,
      systemPrompt,
      attachments,
      corsHeaders
    });

  } catch (error) {
    console.error('Onboarding Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internt fel' }), { status: 500, headers: corsHeaders });
  }
}

