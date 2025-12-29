'use server'

import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActivePrompt, PROMPT_TYPES } from '@/lib/ai/prompt-service'
import type { LeadAnalysis } from './analyze-lead'

/**
 * Schema for Feature Ideas Generation
 * Sprint 9.5: The Persistence Layer
 */
const FeatureIdeasSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe("Kort, säljande titel, t.ex. 'Fordonskoll' (max 3 ord)"),
      description: z.string().describe("Säljande pitch i 1-2 meningar"),
      prompt: z.string().describe("Den fullständiga texten som skickas till chatten vid klick"),
    })
  ).length(3).describe("Exakt 3 konkreta pilot-projekt de kan bygga på 1 dag"),
})

type FeatureIdeasResult = z.infer<typeof FeatureIdeasSchema>

/**
 * Generate Feature Ideas for a newly approved organization
 * This runs asynchronously after organization creation
 * 
 * @param orgId - Organization ID
 * @param enrichmentData - Optional enrichment data from pilot request analysis
 * @param enrichedProfile - Optional enriched profile from Google Search enrichment
 * @returns Success/failure status
 */
export async function generateFeatureIdeas(
  orgId: string,
  enrichmentData?: LeadAnalysis | null,
  enrichedProfile?: string | null
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const supabaseAdmin = createAdminClient()

    // 1. Fetch organization data
    const { data: organization, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, business_profile')
      .eq('id', orgId)
      .single()

    if (fetchError || !organization) {
      console.error('Error fetching organization for feature ideas:', fetchError)
      return {
        success: false,
        error: 'Kunde inte hitta organisationen',
      }
    }

    // 2. Build business context from multiple sources
    // Priority: enrichedProfile (Google Search) > enrichmentData (Lead Analysis) > business_profile (DB)
    let businessContext = 'Företaget har inte angett verksamhetsbeskrivning än. Föreslå generella, populära lösningar som passar de flesta SME-företag.'
    
    // Source 1: Enriched profile from Google Search (most detailed)
    if (enrichedProfile) {
      businessContext = enrichedProfile
      console.log('📊 Using enriched profile from Google Search')
    }
    // Source 2: Enrichment data from pilot request analysis
    else if (enrichmentData) {
      const parts: string[] = []
      if (enrichmentData.summary) parts.push(enrichmentData.summary)
      if (enrichmentData.industry_sni) parts.push(`Bransch: ${enrichmentData.industry_sni}`)
      if (enrichmentData.employee_count && enrichmentData.employee_count !== 'Okänt') {
        parts.push(`Anställda: ${enrichmentData.employee_count}`)
      }
      if (parts.length > 0) {
        businessContext = parts.join('\n')
        console.log('📊 Using enrichment data from lead analysis')
      }
    }
    // Source 3: Existing business_profile in DB (fallback)
    else if (organization.business_profile) {
      try {
        const parsedProfile = JSON.parse(organization.business_profile)
        // If we have enrichment data with summary and industry, use that
        if (parsedProfile.summary && parsedProfile.industry_sni) {
          businessContext = `${parsedProfile.summary}\nBransch: ${parsedProfile.industry_sni}`
        } else if (parsedProfile.summary) {
          businessContext = parsedProfile.summary
        }
      } catch (e) {
        // If it's not JSON, use it as-is
        businessContext = organization.business_profile
      }
      console.log('📊 Using existing business_profile from database')
    }
    
    console.log('📝 Business context preview:', businessContext.substring(0, 100) + '...')

    // 3. Build AI prompt
    const systemPromptFallback = `Du är en expert säljare och affärsutvecklare för IT By Design.
Din uppgift är att föreslå konkreta, säljande pilot-projekt som kunden kan bygga snabbt.

REGLER:
- Föreslå EXAKT 3 projekt
- Varje projekt ska vara genomförbart på 1 dag
- Anpassa förslagen till kundens bransch och verksamhet
- Använd ett säljande språk som väcker intresse
- Var konkret och specifik - undvik generiska förslag
- Fokusera på affärsnytta och tidsbesparing
- Titeln ska vara max 3 ord`.trim()

    const userPromptFallback = `Baserat på följande kundprofil, föreslå 3 konkreta pilot-projekt:

**KUND:** {{organization_name}}
**VERKSAMHET:** {{business_context}}

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
          business_context: businessContext,
        },
        userPromptFallback
      ),
    ])

    console.log('🎯 Generating feature ideas for:', organization.name)

    // 4. Call Gemini with structured output
    const { output: suggestions, usage } = await generateText({
      model: google('gemini-2.0-flash-exp') as any,
      output: Output.object({
        schema: FeatureIdeasSchema,
        name: 'FeatureIdeas',
        description: '3 konkreta pilot-projekt anpassade till kundens verksamhet',
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8, // Higher creativity for variation
    })

    console.log('✅ Feature ideas generated')
    console.log('📊 Token usage:', usage)
    console.log('💡 Ideas:', suggestions.suggestions.map(s => s.title).join(', '))

    // 5. Save to database
    const featureIdeas = suggestions.suggestions.map(idea => ({
      org_id: orgId,
      title: idea.title,
      description: idea.description,
      prompt: idea.prompt,
      status: 'suggested' as const,
      source: 'ai_initial' as const,
      complexity: null, // Not assessed for initial suggestions
    }))

    const { error: insertError } = await supabaseAdmin
      .from('feature_ideas')
      .insert(featureIdeas)

    if (insertError) {
      console.error('Error saving feature ideas:', insertError)
      return {
        success: false,
        error: 'Kunde inte spara feature ideas i databasen',
      }
    }

    console.log(`✅ Saved ${featureIdeas.length} feature ideas for ${organization.name}`)

    return {
      success: true,
      count: featureIdeas.length,
    }
  } catch (error) {
    console.error('Error generating feature ideas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod',
    }
  }
}

