-- Migration: Default Tool Prompts
-- Saturday Jan 3, 2026

INSERT INTO ai_prompts (name, prompt_type, content, is_active)
VALUES
(
  'Default Manage Feature Idea Tool',
  'tool-manage-feature-idea',
  'Använd detta verktyg för att hantera kundens idélista.

ACTIONS:
- create: Skapa en ny idé som kunden nämnt (status: suggested, source: chat_agent)
- update: Uppdatera en befintlig idé (t.ex. ändra beskrivning)
- save: Markera en idé som "sparad" för framtiden (status: saved)
- reject: Markera att kunden inte är intresserad (status: rejected)

VIKTIGT: För update/save/reject måste du ange idea_id (UUID från tidigare conversation).
För create behöver du endast title och description.',
  true
),
(
  'Default Submit Feature Request Tool',
  'tool-submit-feature-request',
  'Använd detta verktyg när kunden godkänner/beställer en funktion.
Trigger-ord: "Kör på det", "Beställ", "Ja tack", "Skapa det", "Gör så".
Detta kommer att generera en teknisk specifikation internt för utvecklarna.

KRITISKT: Du MÅSTE fylla i ALLA tre parametrarna baserat på konversationen hittills.
- feature_summary: Sammanfatta vad kunden vill ha
- estimated_credits: Det pris du nämnde tidigare i konversationen (1, 10 eller 30)
- customer_context: Kopiera relevant kontext från hela konversationen',
  true
),
(
  'Default Generate Pilot Proposal Tool',
  'tool-generate-pilot-proposal',
  'Använd detta verktyg när kunden är redo att starta ett pilotprojekt.

TRIGGER-ORD: "Låter bra", "Vi kör på det", "Ja tack", "Starta", "Gör så"

VIKTIGT: Du MÅSTE härleda komplexitet och kostnad från er diskussion:
- title: En tydlig rubrik för projektet (minst 5 tecken)
- summary: En kort, säljande sammanfattning för kunden.
- key_features: MÅSTE ANGES. En lista (array) med 3-5 konkreta funktioner som ingår.
- complexity: "small" (1-5 dagar) eller "medium" (1-2 veckor).
- estimated_credits: Måste vara ett heltal mellan 1-30.
  (Small: 1-10 krediter, Medium: 10-30 krediter).
- technical_spec: En extremt detaljerad teknisk specifikation för utvecklaren.

Detta skapar ett visuellt förslag som kunden kan godkänna.
Du får ALDRIG lämna title, complexity eller estimated_credits tomma.',
  true
)
ON CONFLICT (name) DO UPDATE SET content = EXCLUDED.content, prompt_type = EXCLUDED.prompt_type;
