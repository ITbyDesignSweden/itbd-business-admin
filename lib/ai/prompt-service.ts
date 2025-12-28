import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Prompt Service
 * Hanterar hämtning och formatering av AI-prompter från databasen.
 */

export const PROMPT_TYPES = {
  CUSTOMER_CHAT: 'customer-chat',
  LEAD_ANALYSIS_SYSTEM: 'lead-analysis-system',
  LEAD_ANALYSIS_USER: 'lead-analysis-user',
  INTERNAL_SPEC: 'internal-spec',
  ORG_ENRICHMENT_SYSTEM: 'org-enrichment-system',
  ORG_ENRICHMENT_USER: 'org-enrichment-user',
} as const;

export type PromptType = typeof PROMPT_TYPES[keyof typeof PROMPT_TYPES];

/**
 * Hämtar den aktiva prompten för en specifik typ och ersätter variabler.
 * 
 * @param type - Typen av prompt (från PROMPT_TYPES)
 * @param variables - Objekt med variabler som ska ersättas i prompten (t.ex. { name: 'ITBD' })
 * @param fallback - En fallback-sträng om ingen aktiv prompt hittas i databasen
 */
export async function getActivePrompt(
  type: PromptType,
  variables: Record<string, any> = {},
  fallback?: string
): Promise<string> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('content')
      .eq('prompt_type', type)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching prompt for type ${type}:`, error);
      if (fallback) return fallback;
      throw error;
    }

    if (!data) {
      if (fallback) return fallback;
      throw new Error(`Ingen aktiv prompt hittades för typen: ${type}`);
    }

    let content = data.content;

    // Ersätt alla {{variable}} med deras värden
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, value !== null && value !== undefined ? String(value) : '');
    }

    return content;
  } catch (error) {
    console.error(`Failed to get active prompt (${type}):`, error);
    if (fallback) return fallback;
    throw error;
  }
}

