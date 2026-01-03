import { tool } from 'ai';
import { z } from 'zod';

/**
 * AI Tool: Generate Pilot Proposal
 * Creates a visual proposal card that the customer can accept
 * Sprint 10.3: The Artifact
 */
export function generatePilotProposalTool(description?: string) {
  const defaultDescription = `Använd detta verktyg när kunden är redo att starta ett pilotprojekt.

    TRIGGER-ORD: "Låter bra", "Vi kör på det", "Ja tack", "Starta", "Gör så"

    VIKTIGT: Du MÅSTE härleda komplexitet och kostnad från er diskussion:
    - title: En tydlig rubrik för projektet (minst 5 tecken)
    - complexity: "small" (1-5 dagar) eller "medium" (1-2 veckor).
    - estimated_credits: Måste vara ett heltal mellan 1-30.
      (Small: 1-10 krediter, Medium: 10-30 krediter).

    Detta skapar ett visuellt förslag som kunden kan godkänna.
    Du får ALDRIG lämna title, complexity eller estimated_credits tomma.`;

  return tool({
    description: description || defaultDescription,

    parameters: z.object({
      title: z.string().min(5).max(100).describe('En säljande rubrik på projektet.'),
      summary: z.string().min(20).max(500).describe('Kort sammanfattning av vad projektet innebär och vilken affärsnytta det ger'),
      complexity: z.enum(['small', 'medium']).describe('Välj medium för nya appar.'),
      key_features: z.array(z.string()).min(3).max(7).describe('Konkreta funktioner som ingår i projektet'),
      estimated_credits: z.number().int().min(1).max(30).describe('Budget i krediter (Sikta på 10-15).')
    }),

    // @ts-ignore - AI SDK execute function
    execute: async (args: any) => {
      const { title, summary, complexity, key_features, estimated_credits } = args;

      console.log('=== Generate Pilot Proposal Tool ===');
      console.log('Title:', title);
      console.log('Complexity:', complexity);
      console.log('Credits:', estimated_credits);
      console.log('Features:', key_features?.length || 0);

      // Validera obligatoriska fält för att förhindra tekniska fel (NaN/undefined) i resultatet
      if (!title || title.length < 5) {
        return {
          success: false,
          error: 'Titeln är för kort eller saknas. Vänligen ange en tydlig titel på minst 5 tecken.',
        };
      }

      if (!complexity) {
        return {
          success: false,
          error: 'Complexity saknas. Du måste välja "small" eller "medium".',
        };
      }

      if (estimated_credits === undefined || estimated_credits === null || isNaN(Number(estimated_credits))) {
        return {
          success: false,
          error: 'Du måste ange estimated_credits (1-30) som ett giltigt nummer baserat på prissättningen vi diskuterat.',
        };
      }

      if (!key_features || key_features.length < 3) {
        return {
          success: false,
          error: 'Förslaget måste innehålla minst 3 funktioner i listan key_features.',
        };
      }

      if (estimated_credits > 30) {
        return {
          success: false,
          error: 'För pilot-projekt ska kostnaden hållas under 30 krediter. Föreslå en mindre version först.',
        };
      }

      // Beräkna priset säkert
      const credits = Number(estimated_credits);
      const priceSek = credits * 5000;

      // Returnera proposal data - frontend kommer att rendera detta som ett kort
      return {
        success: true,
        proposal: {
          title,
          summary,
          complexity,
          key_features,
          estimated_credits: credits,
          estimated_price_sek: priceSek,
        },
      };
    },
  });
}
