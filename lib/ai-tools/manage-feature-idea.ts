import { tool } from 'ai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * AI Tool: Manage Feature Idea
 * Allows the SDR agent to manipulate the feature ideas list
 * Sprint 10.2: The Memory
 */
export function manageFeatureIdeaTool(orgId: string, description?: string) {
  const defaultDescription = `Använd detta verktyg för att hantera kundens idélista.

    ACTIONS:
    - create: Skapa en ny idé som kunden nämnt (status: suggested, source: chat_agent)
    - update: Uppdatera en befintlig idé (t.ex. ändra beskrivning)
    - save: Markera en idé som "sparad" för framtiden (status: saved)
    - reject: Markera att kunden inte är intresserad (status: rejected)

    VIKTIGT: För update/save/reject måste du ange idea_id (UUID från tidigare conversation).
    För create behöver du endast title och description.`;

  return tool({
    description: description || defaultDescription,

    parameters: z.object({
      action: z.enum(['create', 'update', 'save', 'reject']).describe('Vilken operation som ska utföras'),
      title: z.string().min(3).max(100).optional().describe('Kort, beskrivande titel för idén (krävs för create/update)'),
      description: z.string().optional().describe('Längre beskrivning av funktionen (krävs för create)'),
      idea_id: z.string().uuid().optional().describe('UUID för befintlig idé (krävs för update/save/reject)'),
    }),
    type: 'function',

    // @ts-ignore - AI SDK execute function
    execute: async (args: any) => {
      const { action, title, description, idea_id } = args;

      console.log('=== Manage Feature Idea Tool ===');
      console.log('Action:', action);
      console.log('OrgId:', orgId);
      console.log('Title:', title);
      console.log('IdeaId:', idea_id);

      const supabase = createAdminClient();

      try {
        // Validera input baserat på action
        if (action === 'create' && !description) {
          return {
            success: false,
            message: 'Description krävs för att skapa en ny idé',
          };
        }

        if ((action === 'update' || action === 'save' || action === 'reject') && !idea_id) {
          return {
            success: false,
            message: 'idea_id krävs för denna operation',
          };
        }

        // Utför operation
        switch (action) {
          case 'create': {
            const { data, error } = await supabase
              .from('feature_ideas')
              .insert({
                org_id: orgId,
                title,
                description: description!,
                prompt: `Jag vill ha ${title}. ${description}`, // Auto-generera prompt
                status: 'suggested',
                source: 'chat_agent',
              })
              .select('id')
              .single();

            if (error) {
              console.error('Error creating feature idea:', error);
              return {
                success: false,
                message: 'Kunde inte spara idén i databasen',
              };
            }

            return {
              success: true,
              message: `Jag har lagt till "${title}" i din idélista`,
              idea_id: data.id,
            };
          }

          case 'update': {
            const updateData: any = {};
            if (title) updateData.title = title;
            if (description) updateData.description = description;

            const { error } = await supabase
              .from('feature_ideas')
              .update(updateData)
              .eq('id', idea_id)
              .eq('org_id', orgId); // Security check

            if (error) {
              console.error('Error updating feature idea:', error);
              return {
                success: false,
                message: 'Kunde inte uppdatera idén',
              };
            }

            return {
              success: true,
              message: `Idén "${title}" har uppdaterats`,
            };
          }

          case 'save': {
            const { data, error } = await supabase
              .from('feature_ideas')
              .update({ status: 'saved' })
              .eq('id', idea_id)
              .eq('org_id', orgId)
              .select('title') // Hämta titeln från raden
              .single();

            if (error) {
              console.error('Error saving feature idea:', error);
              return {
                success: false,
                message: 'Kunde inte spara idén',
              };
            }

            return {
              success: true,
              message: `Idén "${data.title}" är nu sparad för framtiden`,
            };
          }

          case 'reject': {
            const { data,error } = await supabase
              .from('feature_ideas')
              .update({ status: 'rejected' })
              .eq('id', idea_id)
              .eq('org_id', orgId)
              .select('title') // Hämta titeln från raden
              .single();

            if (error) {
              console.error('Error rejecting feature idea:', error);
              return {
                success: false,
                message: 'Kunde inte markera idén som rejected',
              };
            }

            return {
              success: true,
              message: `Okej, jag har noterat att "${data.title}" inte är relevant just nu`,
            };
          }

          default:
            return {
              success: false,
              message: 'Okänd action',
            };
        }
      } catch (error) {
        console.error('Error in manage_feature_idea tool:', error);
        return {
          success: false,
          message: 'Ett tekniskt fel uppstod',
        };
      }
    },
  });
}
