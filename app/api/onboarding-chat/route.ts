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
import { manageFeatureIdeaTool } from '@/lib/ai-tools/manage-feature-idea';
import { generatePilotProposalTool } from '@/lib/ai-tools/generate-pilot-proposal';
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

    // Step 2: Fetch organization data and feature ideas as Admin (since user is anonymous)
    const supabaseAdmin = createAdminClient();
    
    const [orgResult, ideasResult] = await Promise.all([
      supabaseAdmin
        .from('organizations_with_credits')
        .select('name, business_profile')
        .eq('id', orgId)
        .single(),
      supabaseAdmin
        .from('feature_ideas')
        .select('id, title, description, status')
        .eq('org_id', orgId)
        .in('status', ['suggested', 'saved']) // Hämta endast aktiva idéer
        .order('created_at', { ascending: false })
    ]);
    
    const org = orgResult.data;
    const ideas = ideasResult.data || [];
    
    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organisation hittades ej' }), 
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log('Fetched feature ideas:', ideas.length);

    // Step 3: Build contextual system prompt with feature ideas
    const ideasContext = ideas.length > 0
      ? `\n\n### AKTUELLA IDÉER (Från tidigare konversation)\n${ideas.map((idea, i) => `${i + 1}. **${idea.title}** (${idea.status})\n   ${idea.description}\n   ID: ${idea.id}`).join('\n')}`
      : '\n\n### AKTUELLA IDÉER\nIngen idélista genererad än.';
    
    const defaultSystemPrompt = `Du är en konsultativ säljare (SDR) för IT By Design som hjälper små och medelstora företag att digitalisera sin verksamhet.

**DIN ROLL:**
- Förstå kundens behov genom att ställa öppna frågor
- Föreslå konkreta, små pilotprojekt (Small eller Medium komplexitet)
- Använd verktygen för att komma ihåg kundens önskemål
- Målet är att komma fram till ETT pilotprojekt att starta med

**PRISSÄTTNING:**
- Small projekt (1-5 dagar): 1-10 krediter (~5,000-50,000 SEK)
- Medium projekt (1-2 veckor): 10-30 krediter (~50,000-150,000 SEK)
- Vi börjar alltid smått - stora idéer sparar vi till senare!

**VERKTYG DU HAR:**
1. **manage_feature_idea**: Skapa, uppdatera eller spara idéer som kunden nämner
2. **generate_pilot_proposal**: När ni är överens, skapa ett formellt förslag

**STRATEGI:**
1. Ställ 2-3 öppna frågor om deras verksamhet och utmaningar
2. Föreslå 1-2 konkreta lösningar baserat på deras bransch
3. Om kunden nämner flera idéer, använd manage_feature_idea för att spara dem
4. När ni hittat rätt projekt, använd generate_pilot_proposal
5. Förslaget ska vara KONKRET med features och pris`;
    
    const systemPrompt = await getPromptFromService(
      PROMPT_TYPES.SDR_CHAT_SYSTEM,
      { 
        organization_name: org.name, 
        business_profile: org.business_profile || "Okänd verksamhet",
        ideas_context: ideasContext
      },
      defaultSystemPrompt + ideasContext
    );

    // Step 4: Process chat stream with tools
    return processAiChatStream({
      messages,
      systemPrompt,
      tools: {
        manage_feature_idea: manageFeatureIdeaTool(orgId),
        generate_pilot_proposal: generatePilotProposalTool(),
      },
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

