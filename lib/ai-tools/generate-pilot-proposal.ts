import { tool } from 'ai';
import { z } from 'zod';

/**
 * AI Tool: Generate Pilot Proposal
 * Creates a visual proposal card that the customer can accept
 * Sprint 10.3: The Artifact
 */
export function generatePilotProposalTool() {
  return tool({
    description: `Använd detta verktyg när kunden är redo att starta ett pilotprojekt.
    
    TRIGGER-ORD: "Låter bra", "Vi kör på det", "Ja tack", "Starta", "Gör så"
    
    Detta kommer att generera ett visuellt förslag som kunden kan godkänna med ett klick.
    
    VIKTIGT: Förslaget ska vara KONKRET och RIMLIGT:
    - Komplexitet: "small" = 1-5 dagar, "medium" = 1-2 veckor
    - Kostnad: Baserat på vad ni diskuterat (1-30 krediter)
    - Features: 3-5 konkreta funktioner som ingår
    
    ALDRIG föreslå "large" projekt - håll det småskaligt för pilot!`,
    
    parameters: z.object({
      title: z.string().min(5).max(100).describe('Projektets titel, t.ex. "Kundregister för Bilverkstad AB"'),
      summary: z.string().min(20).max(500).describe('Kort sammanfattning av vad projektet innebär och vilken affärsnytta det ger'),
      complexity: z.enum(['small', 'medium']).describe('Small = 1-5 dagar, Medium = 1-2 veckor. ALDRIG large för pilot!'),
      key_features: z.array(z.string()).min(3).max(7).describe('Konkreta funktioner som ingår i projektet'),
      estimated_credits: z.number().int().min(1).max(30).describe('Kostnad i krediter baserat på diskussionen (1 kredit = ~5000 SEK)'),
    }),
    
    // @ts-ignore - AI SDK execute function
    execute: async (args: any) => {
      const { title, summary, complexity, key_features, estimated_credits } = args;
      
      console.log('=== Generate Pilot Proposal Tool ===');
      console.log('Title:', title);
      console.log('Complexity:', complexity);
      console.log('Credits:', estimated_credits);
      console.log('Features:', key_features.length);
      
      // Validering
      if (key_features.length < 3) {
        return {
          success: false,
          error: 'Förslaget måste innehålla minst 3 funktioner',
        };
      }
      
      if (estimated_credits > 30) {
        return {
          success: false,
          error: 'För pilot-projekt ska kostnaden hållas under 30 krediter. Föreslå en mindre version först.',
        };
      }
      
      // Returnera proposal data - frontend kommer att rendera detta som ett kort
      return {
        success: true,
        proposal: {
          title,
          summary,
          complexity,
          key_features,
          estimated_credits,
          estimated_price_sek: estimated_credits * 5000, // Ungefärligt pris
        },
      };
    },
  });
}


