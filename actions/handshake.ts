'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { validateInvitationToken, markTokenAsUsed } from '@/lib/auth/token-gate';

export interface ProposalData {
  title: string;
  summary: string;
  complexity: 'small' | 'medium';
  key_features: string[];
  estimated_credits: number;
  estimated_price_sek: number;
  // Sprint 11: Hidden fields for technical handover
  related_feature_id?: string | null;
  technical_spec: string;
}

interface AcceptProposalResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

/**
 * Sprint 10.4: The Handshake
 * Converts a lead to an active pilot customer
 *
 * Flow:
 * 1. Validate token and get orgId
 * 2. Create project in database
 * 3. Update organization status to active_pilot
 * 4. Mark token as used
 * 5. Send auth invitation email via Supabase
 */
export async function acceptProposal(
  token: string,
  proposalData: ProposalData
): Promise<AcceptProposalResult> {
  console.log('=== Accept Proposal (The Handshake) ===');
  console.log('Proposal:', proposalData.title);

  try {
    // Step 1: Validate token and get orgId
    let orgId: string;
    try {
      orgId = await validateInvitationToken(token);
      console.log('Token validated, org_id:', orgId);
    } catch (error: any) {
      console.error('Token validation failed:', error);
      return {
        success: false,
        error: 'Ogiltig eller utgången inbjudningslänk',
      };
    }

    const supabase = createAdminClient();

    // Step 2: Fetch organization AND original pilot_request to get email
    const [orgResult, requestResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, status')
        .eq('id', orgId)
        .single(),
      supabase
        .from('pilot_requests')
        .select('email')
        .eq('org_id', orgId)
        .single()
    ]);

    const org = orgResult.data;
    const pilotRequest = requestResult.data;

    if (orgResult.error || !org) {
      console.error('Error fetching organization:', orgResult.error);
      return {
        success: false,
        error: 'Kunde inte hitta organisationen',
      };
    }

    if (requestResult.error || !pilotRequest) {
      console.error('Error fetching pilot request for org:', orgId, requestResult.error);
      return {
        success: false,
        error: 'Kunde inte hitta kontaktinformation för inbjudan',
      };
    }

    const contactEmail = pilotRequest.email;
    console.log('Organization:', org.name, '| Contact Email:', contactEmail);

    // Step 3: Create project with blueprint (Sprint 11: The Technical Handover)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        title: proposalData.title,
        status: 'active_pilot',
        cost_credits: proposalData.estimated_credits,
        // Sprint 11: Save technical specification and link to feature idea
        ai_blueprint: proposalData.technical_spec,
        source_feature_idea_id: proposalData.related_feature_id || null,
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error('Error creating project:', projectError);
      return {
        success: false,
        error: 'Kunde inte skapa projekt i databasen',
      };
    }

    console.log('✅ Project created:', project.id);
    console.log('📋 Blueprint saved:', proposalData.technical_spec.length, 'characters');
    if (proposalData.related_feature_id) {
      console.log('🔗 Linked to feature idea:', proposalData.related_feature_id);
    }

    // Step 4: If linked to a feature idea, update its status to 'planned'
    if (proposalData.related_feature_id) {
      const { error: featureUpdateError } = await supabase
        .from('feature_ideas')
        .update({ status: 'planned' })
        .eq('id', proposalData.related_feature_id);

      if (featureUpdateError) {
        console.error('Error updating feature idea status:', featureUpdateError);
        // Non-critical - continue anyway
      } else {
        console.log('✅ Feature idea marked as planned');
      }
    }

    // Step 5: Update organization status to active_pilot
    const { error: orgUpdateError } = await supabase
      .from('organizations')
      .update({ status: 'active_pilot' })
      .eq('id', orgId);

    if (orgUpdateError) {
      console.error('Error updating organization status:', orgUpdateError);
      // Non-critical - continue anyway
    } else {
      console.log('✅ Organization status updated to active_pilot');
    }

    // Step 6: Mark token as used (prevents re-use of onboarding link)
    try {
      await markTokenAsUsed(token);
      console.log('✅ Token marked as used');
    } catch (error) {
      console.error('Error marking token as used:', error);
      // Non-critical - continue
    }

    // Step 7: Send authentication invitation via Supabase Auth Admin
    try {
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        contactEmail,
        {
          data: {
            org_id: orgId,
            org_name: org.name,
            onboarding_project_id: project.id,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/welcome`,
        }
      );

      if (inviteError) {
        console.error('Error sending auth invitation:', inviteError);

        // Check if user already exists
        if (inviteError.message?.includes('already registered')) {
          return {
            success: false,
            error: 'En användare med denna e-post finns redan. Kontakta support för hjälp.',
          };
        }

        return {
          success: false,
          error: 'Kunde inte skicka inbjudningsmail. Kontakta support.',
        };
      }

      console.log('✅ Auth invitation sent to:',requestResult.data?.email);
      console.log('Invite user:', inviteData?.user?.id);

    } catch (error: any) {
      console.error('Exception sending auth invitation:', error);
      return {
        success: false,
        error: 'Ett tekniskt fel uppstod vid e-postutskick',
      };
    }

    // Success!
    return {
      success: true,
      projectId: project.id,
    };

  } catch (error) {
    console.error('Unexpected error in acceptProposal:', error);
    return {
      success: false,
      error: 'Ett oväntat fel uppstod. Kontakta support.',
    };
  }
}
