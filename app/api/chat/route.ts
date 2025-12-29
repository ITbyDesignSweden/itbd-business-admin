import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { validateApiKey } from '@/lib/api-auth';
import { getActivePrompt as getPromptFromService, PROMPT_TYPES } from '@/lib/ai/prompt-service';
import { createClient } from '@/lib/supabase/server';
import { processAiChatStream, CustomUIMessage } from '@/lib/ai/chat-core';
import { submitFeatureRequestTool } from '@/lib/ai-tools/submit-feature-request';
import { UIMessage } from 'ai';

// Rate limiting: Simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

/**
 * Build contextual system prompt for Architect
 */
async function buildArchitectPrompt(
  supabase: any,
  orgName: string,
  businessProfile: string | null,
  credits: number | null,
  customInstructions: string | null,
  schema?: string
): Promise<string> {
  const basePrompt = await getPromptFromService(PROMPT_TYPES.CUSTOMER_CHAT, {}, `Du är ITBD Intelligent Architect...`);
  
  const contextSection = `
### KUNDKONTEXT (Aktuell Session)
- **Kund:** ${orgName}
- **Verksamhet:** ${businessProfile || "Okänd verksamhet"}
- **Kreditsaldo:** ${credits ?? 0} krediter

${schema ? `### NUVARANDE DATABASSTRUKTUR\n${schema}\n` : ''}
${customInstructions ? `### KUNDSPECIFIKA INSTRUKTIONER\n${customInstructions}\n` : ''}
---
`;

  return contextSection + basePrompt;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface ChatRequestBody {
  messages: UIMessage[];
  projectId: string;
  schema?: string;
  attachments?: Array<{ name: string; url: string; contentType: string }>;
}

/**
 * API Route for Intelligent Architect
 * Handles: Admin Session OR External API Key
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, schema, attachments }: ChatRequestBody = await req.json();

    console.log('=== Architect Chat API Request ===');
    console.log('Project ID:', projectId);
    console.log('Messages count:', messages?.length);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Serverkonfigurationsfel' }), { status: 500, headers: corsHeaders });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = await createClient();
    
    // 1. Authenticate
    const { data: { session } } = await supabaseUser.auth.getSession();
    const authHeader = req.headers.get("authorization");
    const isExternal = authHeader?.startsWith("Bearer itbd_");

    if (!session && !isExternal) {
      return new Response(JSON.stringify({ error: 'Obehörig: Inloggning krävs' }), { status: 401, headers: corsHeaders });
    }

    // 2. Rate Limiting
    const rateLimitId = isExternal ? createHash("sha256").update(authHeader!).digest("hex") : session?.user?.id || 'anon';
    if (isRateLimited(rateLimitId)) {
      return new Response(JSON.stringify({ error: 'För många anrop' }), { status: 429, headers: corsHeaders });
    }

    // 3. Get Project and Verify Access
    const { data: project } = await supabaseAdmin.from('projects').select('org_id').eq('id', projectId).single();
    const orgId = project?.org_id;
    console.log('Project:', project);
    console.log('OrgId:', orgId);
    if (!project) return new Response(JSON.stringify({ error: 'Ogiltigt projekt' }), { status: 404, headers: corsHeaders });

    if (isExternal) {
      const auth = await validateApiKey(req);
      if (!auth.success || auth.orgId !== project.org_id) {
        return new Response(JSON.stringify({ error: 'Ogiltig API-nyckel' }), { status: 403, headers: corsHeaders });
      }
    } else {
      // Check RLS for logged in user
      const { data: userOrg } = await supabaseUser.from('organizations').select('id').eq('id', project.org_id).single();
      if (!userOrg) return new Response(JSON.stringify({ error: 'Obehörig tillgång' }), { status: 403, headers: corsHeaders });
    }

    // 4. Get Data and Prompt
    const { data: org } = await supabaseAdmin.from('organizations_with_credits').select('*').eq('id', project.org_id).single();
    if (!org) return new Response(JSON.stringify({ error: 'Organisation hittades ej' }), { status: 404, headers: corsHeaders });

    const systemPrompt = await buildArchitectPrompt(supabaseAdmin, org.name, org.business_profile, org.total_credits, org.custom_ai_instructions, schema);

    // 5. Delegate to Core
    return processAiChatStream({
      messages, 
      systemPrompt,
      connectionNotificationText: 'Ansluter till ITBD Intelligent Architect...',
      tools: {
        submit_feature_request: submitFeatureRequestTool(projectId, orgId),
      },
      attachments,
      corsHeaders
    });

  } catch (error) {
    console.error('Architect API Error:', error);
    return new Response(JSON.stringify({ error: 'Internt fel' }), { status: 500, headers: corsHeaders });
  }
}
