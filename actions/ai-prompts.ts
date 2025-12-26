'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AIPrompt {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new AI prompt
 */
export async function createPrompt(data: { name: string; content: string; is_active: boolean }) {
  const supabase = await createClient();

  // Om den nya prompten ska vara aktiv, inaktivera alla andra först
  if (data.is_active) {
    await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .eq('is_active', true);
  }

  const { data: prompt, error } = await supabase
    .from('ai_prompts')
    .insert({
      name: data.name,
      content: data.content,
      is_active: data.is_active,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating prompt:', error);
    throw new Error('Kunde inte skapa prompt: ' + error.message);
  }

  revalidatePath('/settings/prompts');
  return prompt;
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(id: string, data: { name: string; content: string; is_active: boolean }) {
  const supabase = await createClient();

  // Om prompten ska aktiveras, inaktivera alla andra först
  if (data.is_active) {
    await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .neq('id', id);
  }

  const { data: prompt, error } = await supabase
    .from('ai_prompts')
    .update({
      name: data.name,
      content: data.content,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error);
    throw new Error('Kunde inte uppdatera prompt: ' + error.message);
  }

  revalidatePath('/settings/prompts');
  return prompt;
}

/**
 * Toggle prompt active status
 */
export async function togglePromptActive(id: string, currentStatus: boolean) {
  const supabase = await createClient();

  const newStatus = !currentStatus;

  // Om vi aktiverar denna prompt, inaktivera alla andra
  if (newStatus) {
    await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .neq('id', id);
  }

  const { error } = await supabase
    .from('ai_prompts')
    .update({ 
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error toggling prompt:', error);
    throw new Error('Kunde inte ändra prompt-status: ' + error.message);
  }

  revalidatePath('/settings/prompts');
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_prompts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting prompt:', error);
    throw new Error('Kunde inte ta bort prompt: ' + error.message);
  }

  revalidatePath('/settings/prompts');
}

