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
  SDR_STARTERS_SYSTEM: 'sdr-starters-system',
  SDR_STARTERS_USER: 'sdr-starters-user',
  SDR_CHAT_SYSTEM: 'sdr-chat-system',
  TOOL_MANAGE_FEATURE_IDEA: 'tool-manage-feature-idea',
  TOOL_SUBMIT_FEATURE_REQUEST: 'tool-submit-feature-request',
  TOOL_GENERATE_PILOT_PROPOSAL: 'tool-generate-pilot-proposal',
} as const;

export type PromptType = typeof PROMPT_TYPES[keyof typeof PROMPT_TYPES];

export const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  [PROMPT_TYPES.CUSTOMER_CHAT]: 'Kundchatt (AI Architect)',
  [PROMPT_TYPES.LEAD_ANALYSIS_SYSTEM]: 'Lead Analys (System)',
  [PROMPT_TYPES.LEAD_ANALYSIS_USER]: 'Lead Analys (User)',
  [PROMPT_TYPES.INTERNAL_SPEC]: 'Teknisk Specifikation',
  [PROMPT_TYPES.ORG_ENRICHMENT_SYSTEM]: 'Företagsanalys (System)',
  [PROMPT_TYPES.ORG_ENRICHMENT_USER]: 'Företagsanalys (User)',
  [PROMPT_TYPES.SDR_STARTERS_SYSTEM]: 'SDR Starters (System)',
  [PROMPT_TYPES.SDR_STARTERS_USER]: 'SDR Starters (User)',
  [PROMPT_TYPES.SDR_CHAT_SYSTEM]: 'SDR Chatt (System)',
  [PROMPT_TYPES.TOOL_MANAGE_FEATURE_IDEA]: 'Verktyg: Hantera Funktionsidé',
  [PROMPT_TYPES.TOOL_SUBMIT_FEATURE_REQUEST]: 'Verktyg: Skicka Funktionsförfrågan',
  [PROMPT_TYPES.TOOL_GENERATE_PILOT_PROPOSAL]: 'Verktyg: Generera Pilotförslag',
};

/**
 * Ersätter {{variable}} i en sträng med värden från ett objekt.
 */
export function formatPrompt(content: string, variables: Record<string, any> = {}): string {
  let formattedContent = content;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    formattedContent = formattedContent.replace(placeholder, value !== null && value !== undefined ? String(value) : '');
  }
  return formattedContent;
}

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

    return formatPrompt(data.content, variables);
  } catch (error) {
    console.error(`Failed to get active prompt (${type}):`, error);
    if (fallback) return fallback;
    throw error;
  }
}

/**
 * Hämtar flera aktiva prompter i ett enda databasanrop.
 *
 * @param types - Array med prompt-typer
 * @returns Objekt med prompt_type som nyckel och content som värde
 */
export async function getActivePrompts(
  types: PromptType[]
): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('ai_prompts')
      .select('prompt_type, content')
      .in('prompt_type', types)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching multiple prompts:', error);
      return {};
    }

    return (data || []).reduce((acc, row) => {
      acc[row.prompt_type] = row.content;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Failed to get active prompts:', error);
    return {};
  }
}
