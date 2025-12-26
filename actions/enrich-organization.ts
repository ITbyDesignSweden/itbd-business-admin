'use server';

import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { revalidatePath } from 'next/cache';

/**
 * Enrich Organization Profile using Google Search Grounding
 * Uses Gemini 3.0 Flash with Google Search to automatically research and create a business profile
 */

interface EnrichOrganizationResult {
  success: boolean;
  businessProfile?: string;
  error?: string;
}

export async function enrichOrganizationProfile(
  orgId: string
): Promise<EnrichOrganizationResult> {
  try {
    const supabase = await createClient();

    // 1. Fetch organization name and website_url
    const { data: organization, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, website_url')
      .eq('id', orgId)
      .single();

    if (fetchError || !organization) {
      console.error('Error fetching organization:', fetchError);
      return {
        success: false,
        error: 'Kunde inte hitta organisationen'
      };
    }

    // Check if we have enough information
    if (!organization.name) {
      return {
        success: false,
        error: 'Organisationsnamn saknas'
      };
    }

    // 2. Call Gemini with Google Search Grounding
    const websiteInfo = organization.website_url 
      ? `Hemsida: ${organization.website_url}` 
      : 'Hemsida: Okänd';

    console.log('🔍 Enriching organization:', organization.name);
    console.log('🌐 Website:', organization.website_url || 'None provided');

    const { text, usage } = await generateText({
      model: google('gemini-3-flash-preview', {
        useSearchGrounding: true // Enable Google Search integration
      }),
      system: `Du är en affärsanalytiker som specialiserat dig på svensk företagsanalys. 
Din uppgift är att använda Google Search för att verifiera och sammanställa information om företag.
Svara alltid på svenska och fokusera på faktabaserad, säljstödjande information.`,
      prompt: `Skapa en detaljerad företagsprofil för: ${organization.name}
${websiteInfo}

Använd Google Search för att hitta aktuell information och inkludera följande:

1. **Verksamhetsbeskrivning** (2-3 meningar)
   - Vad säljer/erbjuder företaget?
   - Vilka produkter/tjänster?
   
2. **Bransch & SNI-kod** (om tillgänglig)
   - Primär bransch
   - SNI-kod om möjligt

3. **Målgrupp**
   - Vilka är deras kunder?
   - B2B eller B2C?

4. **Företagsstorlek** (om tillgänglig information finns)
   - Antal anställda (uppskattning)
   - Omsättning (om publikt tillgänglig)

Formatera svaret som en löpande, professionell text som kan användas i ett CRM-system.
Håll tonen säljstödjande men faktabaserad. Max 200 ord.`,
    });

    console.log('✅ Profile generated');
    console.log('📊 Token usage:', usage);

    // 3. Save the result to database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ business_profile: text })
      .eq('id', orgId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return {
        success: false,
        error: 'Kunde inte spara profilen'
      };
    }

    // 4. Revalidate the page cache
    revalidatePath(`/organizations/${orgId}`);
    revalidatePath('/organizations');

    return {
      success: true,
      businessProfile: text
    };

  } catch (error) {
    console.error('Error enriching organization profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ett okänt fel uppstod'
    };
  }
}

