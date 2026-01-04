import { tool } from 'ai';
import { z } from 'zod';

/**
 * AI Tool: Generate Pilot Proposal
 * Sprint 11: Optimized for "The Hidden Architect" pattern.
 * Based on business strategist recommendations for token efficiency and clarity.
 */
export function generatePilotProposalTool(description?: string) {
  const defaultDescription = `Använd detta verktyg när kunden är redo att starta ett pilotprojekt.
TRIGGER: "Kör på det", "Låter bra", "Vi startar", "Ja tack".

VIKTIGT: Du har en DUBBEL ROLL - Säljare mot kunden (UI), Arkitekt mot databasen (technical_spec).`;

  return tool({
    description: description || defaultDescription,

    parameters: z.object({
      // --- 1. FÖR KUNDEN (UI) ---
      title: z.string().min(5).max(100).describe('Säljande rubrik (t.ex. "Mobil Tidrapportering").'),
      summary: z.string().min(20).max(500).describe('Kort, värdeskapande sammanfattning för beslutsfattare.'),
      key_features: z.array(z.string()).min(3).max(7).describe('MÅSTE ANGES. Lista på 3-5 konkreta funktioner som ingår i piloten.'),
      complexity: z.enum(['small', 'medium']).describe('Välj Medium för nästan alla nya appar.'),
      estimated_credits: z.number().int().min(1).max(30).describe('Budget i krediter (Sikta på 10-15 för en standardpilot).'),

      // --- 2. LÄNKNING (Historik) ---
      related_feature_id: z.string().optional().describe('KRAV: Om förslaget baseras på en av de tidigare diskuterade idéerna (se listan i system-prompten), MÅSTE du inkludera dess UUID här för att bibehålla historiken.'),

      // --- 3. FÖR UTVECKLAREN (The Hidden Blueprint) ---
      technical_spec: z.string().min(100).describe(`
        EXTREMT DETALJERAD TEKNISK KRAVSPECIFIKATION I MARKDOWN.
        Detta är den ENDA instruktion utvecklaren får. Du måste agera Senior Lösningsarkitekt.

        MÅSTE INNEHÅLLA:

        ### 1. Datamodell (Supabase/Postgres)
        - Tabellnamn (snake_case, engelska).
        - Kolumner med exakta datatyper (text, uuid, timestamptz, boolean, etc).
        - Relationer (Foreign Keys) och Primary Keys (UUID).
        - Indexering för prestanda.
        *Inkludera SQL-exempel eller tydliga tabell-listor.*

        ### 2. Vyer & Sidor (Next.js App Router)
        - URL-struktur (t.ex. '/dashboard', '/vehicles/[id]').
        - Beskriv exakt data som ska visas och vilka formulär som behövs.
        - Definiera nödvändiga Server Actions (t.ex. 'createVehicle').

        ### 3. Säkerhet (RLS)
        - Definiera Row Level Security policies.
        - VIKTIGT: All data måste isoleras per 'org_id'.

        ### 4. Tech Stack & Regler
        - Stack: Next.js 16+, Supabase, Tailwind CSS, Shadcn/ui.
        - Regler: Valideringar, automatiska statusbyten, triggers.

        Gör denna del så teknisk att en junior utvecklare kan bygga appen utan frågor.
      `)
    }),

    // @ts-ignore - AI SDK execute function
    execute: async (args: any) => {
      console.log('=== DEBUG: generate_pilot_proposal args ===');
      console.log(JSON.stringify(args, null, 2));

      const {
        title,
        summary,
        complexity,
        key_features,
        estimated_credits,
        related_feature_id,
        technical_spec
      } = args;

      console.log('=== Processed Args ===');
      console.log('Title:', title);
      console.log('Key Features:', key_features);
      console.log('Key Features Length:', key_features?.length || 0);

      // Validering av obligatoriska fält
      if (!title || title.length < 5) {
        return {
          success: false,
          error: 'Titeln är för kort eller saknas. Vänligen ange en tydlig titel på minst 5 tecken.',
        };
      }

      if (!key_features || !Array.isArray(key_features) || key_features.length < 3) {
        console.error('Validation failed: key_features is missing or too short', key_features);
        return {
          success: false,
          error: 'Du måste ange minst 3 konkreta nyckelfunktioner i fältet key_features.',
        };
      }

      if (estimated_credits === undefined || estimated_credits === null || isNaN(Number(estimated_credits))) {
        return {
          success: false,
          error: 'Du måste ange estimated_credits (1-30) som ett giltigt nummer.',
        };
      }

      if (!technical_spec || technical_spec.length < 100) {
        return {
          success: false,
          error: 'Du måste skriva en detaljerad teknisk specifikation i fältet technical_spec (minst 100 tecken).',
        };
      }

      // Beräkna priset säkert
      const credits = Number(estimated_credits);
      const priceSek = credits * 5000;

      return {
        success: true,
        proposal: {
          title,
          summary,
          complexity,
          key_features,
          estimated_credits: credits,
          estimated_price_sek: priceSek,
          // Hidden fields for backend:
          related_feature_id: related_feature_id || null,
          technical_spec,
        },
      };
    },
  });
}
