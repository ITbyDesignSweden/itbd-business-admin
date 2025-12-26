'use server';

import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Generate Internal Technical Specification
 * Uses Gemini 3.0 Flash to create a detailed spec for developers
 * This is HIDDEN from the customer
 */

interface GenerateSpecParams {
  projectId: string;
  featureSummary: string;
  estimatedCredits: number;
  customerContext: string;
}

interface GenerateSpecResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export async function generateInternalSpec(
  params: GenerateSpecParams
): Promise<GenerateSpecResult> {
  const { projectId, featureSummary, estimatedCredits, customerContext } = params;

  try {
    const supabase = await createClient();

    // Hämta projektinfo för kontext
    const { data: org } = await supabase
      .from('organizations')
      .select('name, business_profile')
      .eq('id', projectId)
      .single();

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    // Hämta befintligt schema om det finns
    const { data: instanceData } = await supabase
      .from('saas_instances')
      .select('database_schema')
      .eq('organization_id', projectId)
      .single();

    const existingSchema = instanceData?.database_schema || 'Inget schema tillgängligt ännu.';

    // Konstruera prompt för Technical Lead AI
    const technicalPrompt = `Du är en Technical Lead på IT by Design. 
Din uppgift är att ta en säljkonversation och omvandla den till en strukturerad teknisk kravspecifikation för utvecklare.

### KUNDINFO
- **Kund:** ${org.name}
- **Bransch:** ${org.business_profile || 'Okänd'}
- **Uppskattad kostnad:** ${estimatedCredits} krediter

### KUNDENS ÖNSKEMÅL
${featureSummary}

### KONTEXT FRÅN KONVERSATIONEN
${customerContext}

### BEFINTLIGT SCHEMA (Om systemet redan har databas)
\`\`\`sql
${existingSchema}
\`\`\`

---

## DIN UPPGIFT
Skapa en teknisk kravspecifikation i Markdown med följande struktur:

# Feature Request: [Titel]

## 📋 Sammanfattning
[1-2 meningar om vad kunden vill ha]

## 🎯 Affärsvärde
[Varför kunden behöver detta - uttryckt i verksamhetsnytta]

## 🛠 Teknisk Implementering

### Frontend (Next.js + React)
- [ ] Skapa component: ...
- [ ] Uppdatera sida: ...

### Backend (Supabase)
- [ ] Skapa tabell: ...
- [ ] RLS policies: ...
- [ ] Server actions: ...

### Database Schema Changes
\`\`\`sql
-- SQL migrations här
\`\`\`

## 🧪 Testfall
1. ...
2. ...

## 📊 Estimat
- **Krediter:** ${estimatedCredits}
- **Estimerad tid:** [X timmar]

## 🚀 Deployment Notes
[Eventuella viktiga saker att tänka på vid deploy]
`;

    console.log('=== Generating Technical Spec with Gemini ===');

    // Anropa Gemini 3.0 Flash för att generera spec
    const { text: specContent } = await generateText({
      model: google('gemini-3-flash-preview'),
      prompt: technicalPrompt,
      temperature: 0.3, // Låg temperatur för mer strukturerad output
    });

    console.log('=== Spec Generated Successfully ===');
    console.log('Length:', specContent.length, 'characters');

    // Hämta user_id från session för att koppla dokument
    const { data: { user } } = await supabase.auth.getUser();

    // Spara specen i project_documents (internal_only = true)
    const { data: document, error: insertError } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        title: `Feature Request: ${featureSummary.slice(0, 60)}...`,
        content: specContent,
        is_internal: true,
        created_by: user?.id,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error saving spec:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('=== Spec Saved to Database ===');
    console.log('Document ID:', document.id);

    return {
      success: true,
      documentId: document.id,
    };

  } catch (error) {
    console.error('Error in generateInternalSpec:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

