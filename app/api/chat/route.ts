import { google } from '@ai-sdk/google';
import { 
  streamText, 
  convertToModelMessages, 
  UIMessage, 
  createUIMessageStream, 
  createUIMessageStreamResponse 
} from 'ai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitFeatureRequestTool } from '@/lib/ai-tools/submit-feature-request';

/**
 * Define type for custom messages if needed (AI SDK 6)
 */
export type CustomUIMessage = UIMessage<
  {
    modelId?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  },
  {
    notification: {
      message: string;
      level: 'info' | 'success' | 'warning' | 'error';
    };
  }
>;

/**
 * Fetch active AI prompt from database
 */
async function getActivePrompt(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('content')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch active prompt, using fallback:', error);
    return getFallbackSystemPrompt();
  }

  return data.content;
}

/**
 * Build contextual system prompt with organization data
 */
async function buildContextualPrompt(
  orgName: string,
  businessProfile: string | null,
  credits: number | null,
  customInstructions: string | null,
  schema?: string
): Promise<string> {
  const basePrompt = await getActivePrompt();
  
  const contextSection = `
### KUNDKONTEXT (Aktuell Session)
- **Kund:** ${orgName}
- **Verksamhet:** ${businessProfile || "Okänd verksamhet (fråga kunden om deras bransch och användningsområde)"}
- **Kreditsaldo:** ${credits ?? 0} krediter

${schema ? `### NUVARANDE DATABASSTRUKTUR
Kundens system har följande tabeller och fält:

${schema}

**VIKTIGT:** Använd denna struktur för att ge konkreta förslag. Om kunden frågar "Kan jag spåra X?", kolla om det redan finns i schemat. Om inte, föreslå att lägga till det.
` : ''}

${customInstructions ? `### KUNDSPECIFIKA INSTRUKTIONER
${customInstructions}
` : ''}

---
`;

  return contextSection + basePrompt;
}

// Fallback system prompt (används om DB-fetch misslyckas)
function getFallbackSystemPrompt(): string {
  return `Du är ITBD Intelligent Architect.

ROLL: Senior Verksamhetsutvecklare & Affärsstrateg för IT by Design.
Din uppgift är att hjälpa kunder (ofta icke-tekniska chefer) att effektivisera sin verksamhet.

MÅL: Identifiera kundens verksamhetsbehov ("Vi tappar bort följesedlar") och översätt det till digitala lösningar prissatta i Krediter.

### REGLER FÖR KOMMUNIKATION (NO-TECH ZONE)
1. 🚫 **TEKNISKT FÖRBUD:** Du får ALDRIG nämna tekniska termer mot kunden.
   - FÖRBJUDNA ORD: Next.js, Supabase, React, Tailwind, SQL, RLS, Databas, Tabell, API, Backend, Frontend, CRUD.
   - TILLÅTNA ÖVERSÄTTNINGAR:
     * Databas/Tabell -> "Register", "Information", "Pärm".
     * Frontend/Vy -> "Verktyg", "Sida", "Skärm", "Vy".
     * API/Integration -> "Koppling", "Automation", "Flöde".

2. 💰 **PRISMODELL & KREDITER:**
   Du ska alltid ge ett fast pris i Krediter. Använd nedanstående logik för att bedöma storlek, men förklara det för kunden som affärsvärde:
   - **SMALL (1 Kredit):** Justeringar, texter, lägga till ett val i en lista, enklare inställningar.
   - **MEDIUM (10 Krediter):** Nya funktioner. T.ex. ett nytt register (kunder/projekt), PDF-export, mailutskick, sökfunktioner.
   - **LARGE (30 Krediter):** Stora moduler eller kopplingar till andra system (t.ex. Fortnox, BankID).
   *OBS: Nämn ALDRIG timmar eller dagar. Prata endast om Krediter och fast pris.*

3. 🕵️ **UTFORSKA FÖRST:** Föreslå inte en lösning direkt. Ställ frågor för att förstå *varför* de vill ha något.
   - Fråga: "Hur gör ni detta idag?" eller "Vad är det viktigaste för er att få överblick över?"

### ARBETSFLÖDE
1. Lyssna på kundens behov.
2. Ställ följdfrågor tills du förstår processen.
3. Föreslå en lösning beskriven med "verksamhetsord" och ge ett pris (t.ex. "Detta är en Medium-funktion, 10 krediter").
4. När kunden säger JA ("Kör på det", "Beställ", "Ja tack", etc.):
   - Använd verktyget 'submit_feature_request' OMEDELBART
   - Fyll i ALLA tre parametrar från din konversation:
     * feature_summary: En kort sammanfattning (1-2 meningar) av vad kunden vill ha
     * estimated_credits: Det exakta tal du nämnde (1, 10 eller 30)
     * customer_context: Kopiera alla relevanta detaljer från konversationen
   - Efter verktyget returnerar, visa verktygets meddelande till kunden

### EXEMPEL PÅ TONLÄGE
*Användare:* "Jag vill bygga ett kundregister."
*Ditt TANKESÄTT:* "Kundregister = CRUD + Tabell + UI. Detta är en Medium Feature (10p)."
*Ditt SVAR:* "Smart! Att samla kunderna digitalt sparar ofta mycket administrativ tid. Vill ni bara ha kontaktuppgifter, eller vill ni även kunna spara dokument/avtal kopplat till kunden? Detta är normalt en Medium-funktion (10 krediter)."
`;
}

// CORS headers för att tillåta externa domäner
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // I produktion: specificera tillåtna domäner
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Hantera preflight requests (OPTIONS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, schema }: { messages: UIMessage[], projectId: string, schema?: string } = await req.json();

    console.log('=== Chat API Request ===');
    console.log('Project ID:', projectId);
    console.log('Messages count:', messages?.length);
    console.log('Schema provided:', !!schema);
    console.log('Last message:', messages?.[messages.length - 1]);

    // Validera att projectId finns
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Projekt-ID saknas' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validera projectId mot databasen och hämta business profile + credits + custom instructions
    // Use VIEW to get total_credits calculated from credit_ledger
    const supabase = await createClient();
    const { data: organization, error } = await supabase
      .from('organizations_with_credits')
      .select('id, name, business_profile, total_credits, custom_ai_instructions')
      .eq('id', projectId)
      .single();

    if (error || !organization) {
      console.error('Error fetching organization:', error);
      return new Response(
        JSON.stringify({ error: 'Ogiltigt projekt-ID' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Kontrollera att API-nyckeln är konfigurerad
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY är inte konfigurerad');
      return new Response(
        JSON.stringify({ error: 'AI-tjänsten är inte korrekt konfigurerad' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Bygg dynamisk system prompt med kontext (inkl. custom AI instructions)
    const contextualPrompt = await buildContextualPrompt(
      organization.name,
      organization.business_profile,
      organization.total_credits,
      organization.custom_ai_instructions,
      schema
    );

    console.log('=== Contextual Prompt Built ===');
    console.log('Organization:', organization.name);
    console.log('Business Profile:', organization.business_profile || 'Not set');
    console.log('Credits:', organization.total_credits);
    console.log('Custom AI Instructions:', organization.custom_ai_instructions ? 'Yes' : 'No');

    // Skapa AI-modellen
    const model = google('gemini-3-flash-preview');

    // Konvertera UIMessages till model messages
    const modelMessages = await convertToModelMessages(messages);

    // Skapa en UI Message Stream (AI SDK 6)
    const stream = createUIMessageStream<CustomUIMessage>({
      execute: ({ writer }) => {
        // 1. Skicka initial status (transient - sparas inte i historiken)
        writer.write({
          type: 'data-notification',
          data: { 
            message: 'Ansluter till ITBD Intelligent Architect...', 
            level: 'info' 
          },
          transient: true,
        });

        // 2. Starta text-streaming
        const result = streamText({
          model,
          system: contextualPrompt,
          messages: modelMessages,
          temperature: 0.7,
          tools: {
            submit_feature_request: submitFeatureRequestTool(projectId),
          },
          onFinish: () => {
            // Skicka en bekräftelse när AI:n är klar
            writer.write({
              type: 'data-notification',
              data: { 
                message: 'Svar genererat', 
                level: 'success' 
              },
              transient: true,
            });
          }
        });

        // 3. Koppla ihop resultatet med vår stream
        writer.merge(result.toUIMessageStream());

        // 4. Skicka metadata efter att streamen är klar
        (async () => {
          try {
            const usage = await result.usage;
            const response = await result.response;
            
            writer.write({
              type: 'message-metadata',
              messageMetadata: {
                modelId: response.modelId,
                usage: {
                  promptTokens: usage.inputTokens ?? 0,
                  completionTokens: usage.outputTokens ?? 0,
                  totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
                },
              },
            });
          } catch (e) {
            console.error('Error sending metadata:', e);
          }
        })();
      },
    });

    // Returnera UI message stream response
    return createUIMessageStreamResponse({
      stream,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Ett oväntat fel uppstod',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}






