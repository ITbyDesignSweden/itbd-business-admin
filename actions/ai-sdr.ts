'use server'

import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getActivePrompt, PROMPT_TYPES } from '@/lib/ai/prompt-service'

/**
 * Schema for Dynamic Prompt Starters
 * Sprint 9.2: The Hook - AI-genererade förslag för att undvika "Blank Page Syndrome"
 */
const PromptStartersSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe("Kort, säljande titel, t.ex. 'Fordonskoll'"),
      description: z.string().describe("Säljande pitch i 1-2 meningar"),
      prompt: z.string().describe("Den fullständiga texten som skickas till chatten vid klick"),
    })
  ).length(3).describe("Exakt 3 konkreta pilot-projekt de kan bygga på 1 dag"),
})

export type PromptStartersResult = z.infer<typeof PromptStartersSchema>

interface GenerateStartersResult {
  success: boolean
  data?: PromptStartersResult
  error?: string
}

/**
 * Generate Dynamic Prompt Starters using AI
 * Creates 3 personalized suggestions based on the organization's business profile
 * 
 * @param orgId - Organization ID to generate starters for
 * @returns 3 AI-generated project suggestions
 */
export async function generatePromptStarters(orgId: string): Promise<GenerateStartersResult> {
  try {
    const supabase = await createClient()

    // 1. Fetch organization data
    const { data: organization, error: fetchError } = await supabase
      .from('organizations_with_credits')
      .select('id, name, business_profile')
      .eq('id', orgId)
      .single()

    if (fetchError || !organization) {
      console.error('Error fetching organization for starters:', fetchError)
      return {
        success: false,
        error: 'Kunde inte hitta organisationen',
      }
    }

    // 2. Build AI prompt using database prompt service
    const systemPromptFallback = `Du är en expert säljare och affärsutvecklare för IT By Design.
Din uppgift är att föreslå konkreta, säljande pilot-projekt som kunden kan bygga snabbt.

REGLER:
- Föreslå EXAKT 3 projekt
- Varje projekt ska vara genomförbart på 1 dag
- Anpassa förslagen till kundens bransch och verksamhet
- Använd ett säljande språk som väcker intresse
- Var konkret och specifik - undvik generiska förslag
- Fokusera på affärsnytta och tidsbesparing`.trim()

    const userPromptFallback = `Baserat på följande kundprofil, föreslå 3 konkreta pilot-projekt:

**KUND:** {{organization_name}}
**VERKSAMHET:** {{business_profile}}

Skapa 3 förslag som:
1. Löser ett verkligt problem i deras bransch
2. Kan byggas på 1 dag
3. Ger direkt affärsnytta

För varje förslag:
- **Title:** Kort, catchy namn (max 3 ord)
- **Description:** Säljande pitch som förklarar värdet (1-2 meningar)
- **Prompt:** En fullständig förfrågan kunden kan skicka till chatten för att komma igång

Exempel på bra titlar: "Fordonskoll", "Projektöversikt", "Kundregister", "Orderhantering"`.trim()

    const [systemPrompt, userPrompt] = await Promise.all([
      getActivePrompt(
        PROMPT_TYPES.SDR_STARTERS_SYSTEM,
        {},
        systemPromptFallback
      ),
      getActivePrompt(
        PROMPT_TYPES.SDR_STARTERS_USER,
        {
          organization_name: organization.name,
          business_profile: organization.business_profile || 
            'Företaget har inte angett verksamhetsbeskrivning än. Föreslå generella, populära lösningar som passar de flesta SME-företag.',
        },
        userPromptFallback
      ),
    ])

    console.log('🎯 Generating prompt starters for:', organization.name)

    // 3. Call Gemini 2.0 Flash with structured output
    const { output: suggestions, usage } = await generateText({
      model: google('gemini-3-flash-preview') as any,
      output: Output.object({
        schema: PromptStartersSchema,
        name: 'PromptStarters',
        description: '3 konkreta pilot-projekt anpassade till kundens verksamhet',
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8, // Högre kreativitet för variation
    })

    console.log('✅ Prompt starters generated')
    console.log('📊 Token usage:', usage)
    console.log('💡 Suggestions:', suggestions.suggestions.map(s => s.title).join(', '))

    return {
      success: true,
      data: suggestions,
    }
  } catch (error) {
    console.error('Error generating prompt starters:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod',
    }
  }
}


