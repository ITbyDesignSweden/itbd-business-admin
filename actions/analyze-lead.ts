'use server'

import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Schema for the AI analysis result
const AnalysisSchema = z.object({
  turnover_range: z.string().describe("Omsättningsintervall i SEK, t.ex. '10-20 MSEK' eller 'Okänt'"),
  employee_count: z.string().describe("Antal anställda, t.ex. '15-20' eller 'Okänt'"),
  industry_sni: z.string().describe("Trolig bransch eller SNI-kod"),
  summary: z.string().describe("Kort beskrivning av verksamheten (max 2 meningar)"),
  fit_score: z.number().min(0).max(100).describe("Poäng 0-100 baserat på ICP"),
  reasoning: z.string().describe("Kort motivering till poängen (max 2 meningar)")
})

export type LeadAnalysis = z.infer<typeof AnalysisSchema>

/**
 * Analyze a lead using AI with Google Search grounding
 * Sprint 7: The SDR Brain
 * 
 * @param requestId - The pilot request ID to analyze
 * @returns Analysis result or error
 */
export async function analyzeLeadAction(requestId: string): Promise<{
  success: boolean
  error?: string
  data?: LeadAnalysis
}> {
  try {
    const supabaseAdmin = createAdminClient()
    
    // Step 1: Fetch the pilot request (use admin to ensure we get it even if RLS is strict)
    const { data: req, error: fetchError } = await supabaseAdmin
      .from('pilot_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !req) {
      console.error('Error fetching pilot request:', fetchError)
      return {
        success: false,
        error: 'Kunde inte hitta ansökan.'
      }
    }

    // Step 2: Build the AI prompt with ICP context
    const systemPrompt = `
      Du är en senior affärsanalytiker och SDR (Sales Development Representative) för SaaS-plattformen 'IT By Design'.
      Din uppgift är att använda Google Search för att verifiera fakta och sammanställa information om potentiella kunder.
      Svara alltid på svenska och basera din bedömning på faktabaserad information.
    `.trim();

    const prompt = `
      Analysera följande lead:
      FÖRETAG: ${req.company_name}${req.org_nr ? ` (Org nr: ${req.org_nr})` : ''}
      KUNDENS BESKRIVNING: ${req.description || 'Ingen beskrivning tillhandahållen'}

      ICP (Ideal Customer Profile) - Prioritera dessa:
      - Branscher: Bygg, Transport, Handel, Konsult, Tillverkning
      - Storlek: 5-50 anställda
      - Omsättning: > 5 MSEK/år
      - Behov: Digitalisering, automation, IT-support

      INSTRUKTION:
      1. Använd Google Search för att hitta data (t.ex. Allabolag, hemsida, LinkedIn).
      2. Bedöm hur väl de passar vår ICP och sätt Fit Score (0-100):
         - 80-100: Perfekt match.
         - 50-79: Bra match.
         - 0-49: Låg match.
      3. Om information saknas, skriv "Okänt" i relevanta fält och gör en rimlig bedömning av Fit Score.
    `.trim();

    // Step 3: Call AI with search grounding
    const { output: analysis, usage } = await generateText({
      model: (google as any)('gemini-3-flash-preview'),
      output: Output.object({
        schema: AnalysisSchema,
        name: 'LeadAnalysis',
        description: 'Strukturerad analys av ett lead baserat på ICP-kriterier',
      }),
      system: systemPrompt,
      prompt: prompt,
      tools: {
        google_search: google.tools.googleSearch({}),
      },
    });

    console.log(`✅ Lead analysis generated for ${req.company_name}`);
    console.log('📊 Token usage:', usage);

    // Step 4: Save to database (use admin to bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('pilot_requests')
      .update({
        enrichment_data: analysis,
        fit_score: analysis.fit_score
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error saving analysis:', updateError)
      return {
        success: false,
        error: 'Kunde inte spara analysen.'
      }
    }

    // Revalidate the pilot requests page
    revalidatePath('/pilot-requests')
    revalidatePath('/(dashboard)/pilot-requests')

    console.log(`✅ Lead analysis completed for ${req.company_name}: ${analysis.fit_score}/100`)

    return {
      success: true,
      data: analysis
    }
    
  } catch (error) {
    console.error('AI Analysis Failed:', error)
    return {
      success: false,
      error: 'Kunde inte analysera bolaget. Försök igen.'
    }
  }
}

/**
 * Batch analyze multiple leads
 * Useful for admin to trigger analysis on existing leads
 */
export async function batchAnalyzeLeads(requestIds: string[]): Promise<{
  success: boolean
  results: Array<{ id: string; success: boolean; error?: string }>
}> {
  const results = await Promise.allSettled(
    requestIds.map(id => analyzeLeadAction(id))
  )

  return {
    success: true,
    results: results.map((result, idx) => ({
      id: requestIds[idx],
      success: result.status === 'fulfilled' && result.value.success,
      error: result.status === 'rejected' 
        ? 'Oväntat fel' 
        : result.value.error
    }))
  }
}

