import { tool } from 'ai';
import { z } from 'zod';
import { generateInternalSpec } from '@/actions/generate-internal-spec';

/**
 * AI Tool: Submit Feature Request
 * Triggers when customer approves a feature suggestion
 * Generates internal technical spec using Gemini 3.0 Flash
 */
export function submitFeatureRequestTool(projectId: string, orgId: string) {
  return tool({
    description: `Använd detta verktyg när kunden godkänner/beställer en funktion. 
    Trigger-ord: "Kör på det", "Beställ", "Ja tack", "Skapa det", "Gör så".
    Detta kommer att generera en teknisk specifikation internt för utvecklarna.
    
    KRITISKT: Du MÅSTE fylla i ALLA tre parametrarna baserat på konversationen hittills.
    - feature_summary: Sammanfatta vad kunden vill ha
    - estimated_credits: Det pris du nämnde tidigare i konversationen (1, 10 eller 30)
    - customer_context: Kopiera relevant kontext från hela konversationen`,
    
    parameters: z.object({
      feature_summary: z.string().min(10).describe('Kort sammanfattning av funktionen kunden vill ha. Exempel: "Ett digitalt kundregister för att samla kontaktuppgifter och översikt"'),
      estimated_credits: z.number().int().min(1).describe('Uppskattad kostnad i krediter - MÅSTE vara exakt det tal du nämnde tidigare (1, 10, eller 30)'),
      customer_context: z.string().min(20).describe('Alla relevanta detaljer från konversationen som utvecklaren behöver veta. Inkludera kundens behov och önskemål.'),
    }),
    
    // @ts-ignore - AI SDK execute function
    execute: async (args: any) => {
      const { feature_summary, estimated_credits, customer_context } = args;
      
      // Validera att parametrar finns
      if (!feature_summary || !estimated_credits || !customer_context) {
        console.error('=== MISSING PARAMETERS ===');
        console.error('feature_summary:', feature_summary);
        console.error('estimated_credits:', estimated_credits);
        console.error('customer_context:', customer_context);
        return {
          message: 'Internt fel: Kunde inte spara specifikationen. Kontakta support.',
          success: false,
          error: 'Missing required parameters from AI tool',
        };
      }
      
      try {
        console.log('=== Submit Feature Request Tool Triggered ===');
        console.log('Project:', projectId);
        console.log('OrgId:', orgId);
        console.log('Summary:', feature_summary);
        console.log('Credits:', estimated_credits);
        console.log('Context length:', customer_context?.length || 0);
        
        // Generera teknisk spec internt (dolt för kunden)
        const result = await generateInternalSpec({
          projectId,
          orgId,
          featureSummary: feature_summary,
          estimatedCredits: estimated_credits,
          customerContext: customer_context,
        });

        if (!result.success) {
          console.error('Failed to generate spec:', result.error);
          return {
            message: 'Det uppstod ett tekniskt problem. Jag har loggat ditt önskemål manuellt och en utvecklare kommer att kontakta dig.',
            success: false,
          };
        }

        // Returnera trevligt svar till kunden (utan tekniska detaljer)
        return {
          message: `Perfekt! Jag har registrerat ditt önskemål i systemet. En utvecklare kommer att granska specifikationen och höra av sig inom kort. Du kan följa statusen under "Mina beställningar" i din portal.`,
          success: true,
          document_id: result.documentId,
        };
        
      } catch (error) {
        console.error('Error in submit_feature_request tool:', error);
        return {
          message: 'Det uppstod ett tekniskt problem. Kontakta support via hello@itbydesign.se.',
          success: false,
        };
      }
    },
  });
}

