import { google } from '@ai-sdk/google';
import { 
  streamText, 
  convertToModelMessages, 
  UIMessage, 
  createUIMessageStream, 
  createUIMessageStreamResponse,
  ToolLoopAgent,
  createAgentUIStream,
  stepCountIs
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

### MULTIMODAL FÖRMÅGA (BILDER & FILER)
- Du har tillgång till bifogade filer (bilder, PDF, dokument).
- **Analysera visuellt:** Om kunden laddar upp skärmdumpar, skisser, Excel-ark eller prototyper, studera dem noggrant för att förstå deras nuvarande arbetsflöde eller önskad design.
- **GDPR-SKYDD:** Om du ser känsliga personuppgifter (namn, telefonnummer, personnummer, e-post) i bilder eller dokument, IGNORERA dessa helt. Fokusera enbart på struktur, layout och affärslogik.
- **Exempel på användning:**
  * Kund laddar upp bild på en pappersorder → Du identifierar fält (Artikelnr, Antal, Pris) och föreslår ett digitalt register.
  * Kund visar skärmdump från konkurrerande system → Du analyserar funktioner och föreslår liknande lösning.

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
   - Använd verktyget 'submit_feature_request' OMEDELBART.
   - Fyll i ALLA tre parametrar från din konversation.
   - **VIKTIGT:** När verktyget har körts och returnerat ett resultat, MÅSTE du skriva ett vänligt bekräftelsemeddelande till kunden där du berättar att allt är klart och vad nästa steg är. Använd informationen i verktygets svar för att formulera ditt meddelande.

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

interface ChatRequestBody {
  messages: UIMessage[];
  projectId: string;
  schema?: string;
  attachments?: Array<{ name: string; url: string; contentType: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, schema, attachments }: ChatRequestBody = await req.json();

    console.log('=== Chat API Request ===');
    console.log('Project ID:', projectId);
    console.log('Messages count:', messages?.length);
    console.log('Schema provided:', !!schema);
    console.log('Attachments:', attachments?.length || 0);
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

    // Skapa AI-modellen (Gemini 2.0 Flash stödjer multimodal natively)
    const model = google('gemini-3-flash-preview');

    // Process attachments if present - add them to the last user message
    let processedMessages: any[] = messages;
    if (attachments && attachments.length > 0) {
      console.log('Processing attachments for multimodal input...');
      
      // Clone messages array
      processedMessages = [...messages];
      const lastMessageIndex = processedMessages.length - 1;
      const lastMessage = processedMessages[lastMessageIndex];
      
      // Add image parts to the message
      // For Gemini, we need to fetch the images and convert to base64
      const imageParts = await Promise.all(
        attachments
          .filter(att => att.contentType.startsWith('image/'))
          .map(async (att) => {
            try {
              // Fetch the signed URL and convert to base64
              const response = await fetch(att.url);
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              
              return {
                type: 'image' as const,
                image: `data:${att.contentType};base64,${base64}`,
              };
            } catch (error) {
              console.error('Failed to fetch attachment:', att.name, error);
              return null;
            }
          })
      );
      
      // Filter out failed fetches
      const validImageParts = imageParts.filter(p => p !== null);
      
      if (validImageParts.length > 0) {
        // Get the text content from the last message
        const textContent = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
          : lastMessage.parts?.find((p: any) => p.type === 'text')?.text || '';
        
        // Update the last message to include image parts
        processedMessages[lastMessageIndex] = {
          ...lastMessage,
          content: [
            { type: 'text' as const, text: textContent },
            ...validImageParts,
          ],
        };
        
        console.log('Added', validImageParts.length, 'images to the message');
      }
    }

    // Konvertera UIMessages till model messages
    const modelMessages = await convertToModelMessages(processedMessages);
    
    console.log('Model messages prepared:', modelMessages.length, 'messages');

    // Skapa en UI Message Stream (AI SDK 6)
    const stream = createUIMessageStream<CustomUIMessage>({
      // Gör execute asynkron så att vi kan vänta på agentStream
      execute: async ({ writer }) => {
        // 1. Skicka initial status (transient - sparas inte i historiken)
        writer.write({
          type: 'data-notification',
          data: { 
            message: 'Ansluter till ITBD Intelligent Architect...', 
            level: 'info' 
          },
          transient: true,
        });

        // 2. Skapa en Agent för att hantera multi-step loopen (AI SDK 6)
        const agent = new ToolLoopAgent({
          model,
          instructions: contextualPrompt, // I ToolLoopAgent används 'instructions' istället för 'system'
          tools: {
            submit_feature_request: submitFeatureRequestTool(projectId),
          },
          stopWhen: stepCountIs(5),
          onFinish: (result) => {
            // Beräkna total användning från alla steg
            const totalUsage = result.steps.reduce((acc, step) => ({
              inputTokens: acc.inputTokens + (step.usage?.inputTokens ?? 0),
              outputTokens: acc.outputTokens + (step.usage?.outputTokens ?? 0),
            }), { inputTokens: 0, outputTokens: 0 });

            // Skicka metadata när loopen är klar
            writer.write({
              type: 'message-metadata',
              messageMetadata: {
                modelId: result.response.modelId,
                usage: {
                  promptTokens: totalUsage.inputTokens,
                  completionTokens: totalUsage.outputTokens,
                  totalTokens: totalUsage.inputTokens + totalUsage.outputTokens,
                },
              },
            });

            // Skicka en bekräftelse (transient) när AI:n är helt klar
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

        // 3. Starta agent-strömmen för UI och koppla ihop med vår stream
        // Vi använder await här för att säkerställa att execute-funktionen inte avslutas för tidigt
        try {
          const agentStream = await createAgentUIStream({
            agent: agent as any,
            uiMessages: messages, // I createAgentUIStream används 'uiMessages' (UIMessage[])
          });
          await writer.merge(agentStream as any);
        } catch (e) {
          console.error('Error in agent UI stream:', e);
        }
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






