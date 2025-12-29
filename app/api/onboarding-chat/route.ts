/**
 * Sprint 8.5: Secure Onboarding Chat API
 * 
 * Security Change: This endpoint now validates invitation tokens instead of
 * trusting orgId from client. The server derives the orgId from the token,
 * preventing client-side manipulation.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInvitationToken, TokenValidationError } from '@/lib/auth/token-gate';
import { getActivePrompt as getPromptFromService, PROMPT_TYPES } from '@/lib/ai/prompt-service';
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
  token: string;
  attachments?: Array<{ name: string; url: string; contentType: string }>;
}

/**
 * API Route for Onboarding SDR Chat
 * Now uses token-based authentication instead of Magic Link sessions
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, token, attachments }: ChatRequestBody = await req.json();

    console.log('=== Onboarding Chat API Request ===');
    console.log('Token provided:', !!token);
    console.log('Messages count:', messages?.length);
    console.log('Attachments:', attachments?.length || 0);

    // Step 1: Validate token and derive orgId (Security Gate)
    let orgId: string;
    try {
      orgId = await validateInvitationToken(token);
      console.log('Token validated, org_id:', orgId);
    } catch (error) {
      if (error instanceof TokenValidationError) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 401, headers: corsHeaders }
        );
      }
      throw error; // Re-throw unexpected errors
    }

    // Step 2: Fetch organization data as Admin (since user is anonymous)
    const supabaseAdmin = createAdminClient();
    
    const { data: org } = await supabaseAdmin
      .from('organizations_with_credits')
      .select('name, business_profile')
      .eq('id', orgId)
      .single();
    
    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organisation hittades ej' }), 
        { status: 404, headers: corsHeaders }
      );
    }

    // Step 3: Get system prompt
    const systemPrompt = await getPromptFromService(
      PROMPT_TYPES.SDR_CHAT_SYSTEM,
      { organization_name: org.name, business_profile: org.business_profile || "Okänd verksamhet" },
      `Du är en SDR för IT By Design...`
    );

    // Step 4: Process chat stream
    return processAiChatStream({
      messages,
      systemPrompt,
      connectionNotificationText: `Ansluter till ITBD SDR...`,
      attachments,
      corsHeaders
    });

  } catch (error) {
    console.error('Onboarding Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internt fel' }), 
      { status: 500, headers: corsHeaders }
    );
  }
}

