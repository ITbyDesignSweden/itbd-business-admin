import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Build contextual system prompt with organization data
 */
function buildContextualPrompt(
  orgName: string,
  businessProfile: string | null,
  credits: number | null,
  schema?: string
): string {
  const basePrompt = getBaseSystemPrompt();
  
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

---
`;

  return contextSection + basePrompt;
}

// System prompt för AI Architect (v1 - The Salesman)
function getBaseSystemPrompt(): string {
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
4. När kunden säger JA: Generera den tekniska specifikationen via ett "Function Call" (dolt för kunden).

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

    // Validera projectId mot databasen och hämta business profile + credits
    // Use VIEW to get total_credits calculated from credit_ledger
    const supabase = await createClient();
    const { data: organization, error } = await supabase
      .from('organizations_with_credits')
      .select('id, name, business_profile, total_credits')
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

    // Bygg dynamisk system prompt med kontext
    const contextualPrompt = buildContextualPrompt(
      organization.name,
      organization.business_profile,
      organization.total_credits,
      schema
    );

    console.log('=== Contextual Prompt Built ===');
    console.log('Organization:', organization.name);
    console.log('Business Profile:', organization.business_profile || 'Not set');
    console.log('Credits:', organization.total_credits);

    // Skapa AI-modellen
    const model = google('gemini-3-flash-preview');

    // Konvertera UIMessages till model messages
    const modelMessages = await convertToModelMessages(messages);

    // Streama AI-svar
    const result = streamText({
      model,
      system: contextualPrompt,
      messages: modelMessages,
      temperature: 0.7,
    });

    // Returnera UI message stream response (AI SDK 6)
    return result.toUIMessageStreamResponse({
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






