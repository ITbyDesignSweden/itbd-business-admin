-- Migration: AI Prompts Table (Dynamic Brain)
-- Sprint 3: Möjliggör dynamisk styrning av AI utan kod-deploy

-- Tabell för AI-prompts som kan redigeras via Admin UI
CREATE TABLE ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  content text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index för snabb lookup av aktiv prompt
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active) WHERE is_active = true;

-- RLS: Endast autentiserade admins kan läsa/redigera prompts
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompts"
  ON ai_prompts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Lägg till custom_ai_instructions kolumn på organizations
ALTER TABLE organizations 
ADD COLUMN custom_ai_instructions text;

COMMENT ON COLUMN organizations.custom_ai_instructions IS 'Kundspecifika AI-instruktioner som injiceras i system prompt';

-- Tabell för projektdokument (inkl. auto-genererade specs)
CREATE TABLE project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index för snabb lookup per projekt
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_documents_internal ON project_documents(is_internal);

-- RLS: Endast authenticated admins kan se/hantera projekt-dokument
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all documents"
  ON project_documents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed: Default system prompt
INSERT INTO ai_prompts (name, content, is_active) VALUES (
  'default_sales_architect',
  'Du är ITBD Intelligent Architect.

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
4. När kunden säger JA: Använd verktyget submit_feature_request för att registrera önskemålet.

### EXEMPEL PÅ TONLÄGE
*Användare:* "Jag vill bygga ett kundregister."
*Ditt TANKESÄTT:* "Kundregister = CRUD + Tabell + UI. Detta är en Medium Feature (10p)."
*Ditt SVAR:* "Smart! Att samla kunderna digitalt sparar ofta mycket administrativ tid. Vill ni bara ha kontaktuppgifter, eller vill ni även kunna spara dokument/avtal kopplat till kunden? Detta är normalt en Medium-funktion (10 krediter)."',
  true
);

COMMENT ON TABLE ai_prompts IS 'Dynamiska AI system prompts som kan redigeras via Admin UI';
COMMENT ON TABLE project_documents IS 'Projektdokument inkl. auto-genererade tekniska specifikationer';

