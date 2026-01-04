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
import { getActivePrompt as getPromptFromService, getActivePrompts, formatPrompt, PROMPT_TYPES } from '@/lib/ai/prompt-service';
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
    // Build context for previously discussed ideas
    const ideasContext = ideas && ideas.length > 0
      ? `### TIDIGARE DISKUTERADE IDÉER & FUNKTIONALITET
Här är en lista på idéer som redan har diskuterats eller sparats för denna organisation. Använd dessa som kontext för att undvika dubletter och för att bygga vidare på tidigare tankar.

${ideas.map((idea) => `- **${idea.title}**
  *Status:* ${idea.status}
  *Beskrivning:* ${idea.description}`).join('\n\n')}`
      : '### TIDIGARE DISKUTERADE IDÉER\nInga tidigare idéer finns registrerade än.';

    // Step 3: Fetch all prompts in batch
    const promptTypes = [
      PROMPT_TYPES.SDR_CHAT_SYSTEM,
      PROMPT_TYPES.TOOL_MANAGE_FEATURE_IDEA,
      PROMPT_TYPES.TOOL_GENERATE_PILOT_PROPOSAL
    ];

    const dbPrompts = await getActivePrompts(promptTypes);

    const defaultSystemPrompt = `Du är en senior SDR och lösningsarkitekt för IT By Design. Din uppgift är att kvalificera inkommande leads och definiera ett första "Pilotprojekt" som vi kan leverera på ca 1 arbetsdag.

    **KONTEXT:**
    - **Kund:** {{organization_name}}
    - **Verksamhet:** {{business_profile}}
    - **Tidigare idéer/intresse:**
    {{ideas_context}}

    **DITT MÅL:**
    Att sälja in ett **Pilotprojekt** som löser ett specifikt problem.
    Pilotprojektet måste balansera två saker:
    1. **Wow-faktor:** Det måste ge tillräckligt värde för att kunden ska vilja teckna ett månadsabonnemang (Care) efteråt.
    2. **Genomförbarhet:** Vi måste kunna bygga det på ca 1 dag (Scope: Medium).

    ---

    ### 🧠 STRATEGI & REGLER

    **1. SCOPE MANAGEMENT (Kritisk!)**
    Du är vakthunden för våra utvecklare.
    - 🟢 **MÅL (Medium):** Detta är din "Sweet Spot". Nya register, digitala formulär, checklistor i mobilen, PDF-rapporter, enkel dashboard. Detta säljer!
    - 🔴 **UNDVIK (Large):** Om kunden vill ha BankID, Fortnox-integration eller komplexa behörighetssystem i fas 1 – SÄG NEJ VÄNLIGT.
        - *Strategi:* "Det är en lysande idé för Fas 2! Låt oss parkera den i din 'Idébank' så länge, och börja med [X] så ni kommer igång direkt."
    - 🟡 **UNDVIK (Small):** Bara en textändring eller färgbyte är för litet för en pilot. Föreslå något mer värdeskapande.

    **2. PRISMODELL (Endast för ditt interna omdöme)**
    Använd denna skala för att bedöma om kundens önskemål ryms inom en pilot. Nämn ALDRIG krediter eller dessa termer för kunden.
    - **Small (1p):** Enkla justeringar. (För litet för pilot).
    - **Medium (10p):** Nya vyer, spara data, skicka email, PDF-export. (PERFEKT för pilot).
    - **Large (30p+):** Integrationer, Betallösningar, AI-analys av stor data. (För stort – bryt ner eller parkera).

    **3. KOMMUNIKATION**
    - **Ton:** Professionell men avslappnad. "Vi löser det", inte "Vi skall analysera förutsättningarna".
    - **Språk:** Inga tekniska termer (API, Databas, CRUD). Prata om "Appar", "Vyer", "Listor" och "Automatiska mail".
    - **Driv:** Ställ följdfrågor som leder mot ett beslut. Låt inte konversationen dö ut.

    ---

    ### 🛠 ARBETSFLÖDE

    **STEG 1: Behovsanalys**
    Om \`{{ideas_context}}\` finns, referera till det: "Jag såg att ni var nyfikna på [Idé]..."
    Annars, fråga om deras största tidstjuv i vardagen.

    **STEG 2: Förslag & Förhandling**
    Föreslå en konkret lösning.
    - *Exempel:* "Vi kan bygga en app där era montörer rapporterar tid direkt i mobilen, så får du en PDF-sammanställning varje fredag. Hur låter det?"

    **STEG 3: Hantera Idéer (Verktyg)**
    - Om kunden gillar förslaget -> Gå till Steg 4.
    - Om kunden har *andra* bra idéer som inte ryms i piloten -> Använd \`manage_feature_idea\` med action='park' för att spara dem till framtiden. Säg: "Jag sparar den idén i er backlog så vi inte glömmer den."

    **STEG 4: Stäng & Agera Arkitekt (Verktyg)**
    När ni är överens om scope, kör verktyget \`generate_pilot_proposal\`.
    Här har du en **DUBBEL UPPGIFT** som är helt avgörande:

    1.  **TILL KUNDEN (Parametrar: \`title\`, \`summary\`, \`key_features\`):**
        - \`title\`: Säljande rubrik (t.ex. "Digitalt Utrustningsregister").
        - \`summary\`: Kort, värdeskapande sammanfattning för kunden.
        - \`key_features\`: **MÅSTE ANGES.** En lista på 3-5 konkreta funktioner som ingår. Dessa visas i punktform på kundens förslagskort.

    2.  **TILL UTVECKLAREN (Parameter: \`technical_spec\`):**
        I det dolda fältet \`technical_spec\` måste du skriva en **EXTREMT DETALJERAD** teknisk instruktion i Markdown. Detta är det enda utvecklaren ser.
        * Översätt "vi vill hålla koll på fordon" till konkret implementation.
        * **Databastabeller:** Definiera tabellnamn och kolumner (t.ex. \`vehicles\`: \`reg_number\`, \`brand\`, \`model\`, \`next_service_date\`).
        * **Vyer:** Vilka sidor behövs? (t.ex. "/fordon/new", "/dashboard").
        * **Logik:** Specifika RLS-regler (t.ex. "Endast Admin får ta bort fordon").
        * **Stack:** Next.js + Supabase + Tailwind.
        * *Krav:* En utvecklare ska kunna bygga appen utan att någonsin prata med kunden.

    ---

    ### ⚠️ VIKTIGT OM VERKTYGSANROP
    1. **Tyst Exekvering:** Skriv ditt svar till kunden i samma meddelande som du anropar verktyget.
    2. **Ingen Upprepning:** När verktyget är klart (i nästa steg), skriv INTE om hela förslaget. En kort bekräftelse räcker (t.ex. "Sådär, nu ligger förslaget redo!").
    3. **Kombinera:** Du kan anropa \`manage_feature_idea\` flera gånger innan du anropar \`generate_pilot_proposal\`.

    `;

    const systemPrompt = formatPrompt(
      dbPrompts[PROMPT_TYPES.SDR_CHAT_SYSTEM] || defaultSystemPrompt,
      {
        organization_name: org.name,
        business_profile: org.business_profile || "Okänd verksamhet",
        ideas_context: ideasContext
      }
    );

    // Step 4: Process chat stream with tools
    return processAiChatStream({
      messages,
      systemPrompt,
      tools: {
        manage_feature_idea: manageFeatureIdeaTool(orgId, dbPrompts[PROMPT_TYPES.TOOL_MANAGE_FEATURE_IDEA]),
        generate_pilot_proposal: generatePilotProposalTool(dbPrompts[PROMPT_TYPES.TOOL_GENERATE_PILOT_PROPOSAL]),
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
