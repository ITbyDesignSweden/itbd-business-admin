"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PilotRequest, PilotRequestAttachment, PilotRequestWithAttachments } from "@/lib/types/database"
import { verifyTurnstile, getSystemSettings } from "@/lib/security"

// Validation schema for submitting a new pilot request
const submitPilotRequestSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  contact_name: z.string().min(2, "Kontaktperson måste vara minst 2 tecken"),
  company_name: z.string().min(2, "Företagsnamn måste vara minst 2 tecken"),
  org_nr: z.string().optional(),
  description: z.string().optional(),
  turnstile_token: z.string().min(1, "Säkerhetsverifiering krävs"),
  files: z.array(z.object({
    path: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional(),
})

export type SubmitPilotRequestInput = z.infer<typeof submitPilotRequestSchema>

/**
 * Submit a new pilot request with Turnstile verification
 * Sprint 6: The Gatekeeper
 */
export async function submitPilotRequest(
  input: SubmitPilotRequestInput
): Promise<{ success: boolean; error?: string; data?: PilotRequest }> {
  try {
    // Validate input
    const validatedData = submitPilotRequestSchema.parse(input)

    // Step 1: Verify Turnstile token
    const isTurnstileValid = await verifyTurnstile(validatedData.turnstile_token)
    if (!isTurnstileValid) {
      return {
        success: false,
        error: "Säkerhetsverifiering misslyckades. Försök igen.",
      }
    }

    // Step 2: Check system settings (optional - can stop if paused)
    const settings = await getSystemSettings()
    if (!settings) {
      console.warn("Could not fetch system settings, continuing anyway...")
    }

    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Step 3: Create pilot request
    const { data: newRequest, error: requestError } = await supabaseAdmin
      .from("pilot_requests")
      .insert({
        email: validatedData.email,
        contact_name: validatedData.contact_name,
        company_name: validatedData.company_name,
        org_nr: validatedData.org_nr || null,
        description: validatedData.description || null,
        status: "pending",
        turnstile_verified: true,
        lead_source: "web_form",
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating pilot request:", requestError)
      return {
        success: false,
        error: "Kunde inte skapa ansökan. Försök igen.",
      }
    }

    // Step 4: Create attachments if files provided
    if (validatedData.files && validatedData.files.length > 0) {
      const attachments = validatedData.files.map(file => ({
        request_id: newRequest.id,
        file_path: file.path,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      }))

      const { error: attachmentsError } = await supabaseAdmin
        .from("pilot_request_attachments")
        .insert(attachments)

      if (attachmentsError) {
        console.error("Error creating attachments:", attachmentsError)
        // Don't fail the whole request if attachments fail
      }
    }

    // Step 5: Sprint 7 - Trigger AI analysis if enrichment is enabled
    if (settings && settings.enrichment_mode !== 'manual') {
      // Fire and forget - don't await to keep form submission fast
      // Import dynamically to avoid circular dependencies
      import('./analyze-lead').then(({ analyzeLeadAction }) => {
        analyzeLeadAction(newRequest.id).catch(err => 
          console.error('Background analysis failed:', err)
        )
      })
      console.log(`🧠 AI analysis triggered for lead: ${newRequest.company_name}`)
    }

    // Revalidate pilot requests page
    revalidatePath("/pilot-requests")

    return {
      success: true,
      data: newRequest as PilotRequest,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

export async function getAllPilotRequests(): Promise<PilotRequest[]> {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from("pilot_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pilot requests:", error)
    return []
  }

  return requests || []
}

export async function getAllPilotRequestsWithAttachments(): Promise<PilotRequestWithAttachments[]> {
  const supabase = await createClient()

  // Single query with JOIN - Supabase does this efficiently in the database
  const { data, error } = await supabase
    .from("pilot_requests")
    .select(`
      *,
      pilot_request_attachments (
        id,
        created_at,
        request_id,
        file_path,
        file_name,
        file_type,
        file_size
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pilot requests with attachments:", error)
    return []
  }

  if (!data) return []

  // Transform nested data to our type structure
  return data.map(request => ({
    ...request,
    attachments: request.pilot_request_attachments || []
  }))
}

export async function getPilotRequestAttachments(requestId: string): Promise<PilotRequestAttachment[]> {
  const supabase = await createClient()

  const { data: attachments, error } = await supabase
    .from("pilot_request_attachments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching attachments:", error)
    return []
  }

  return attachments || []
}

export async function getPendingPilotRequests(): Promise<PilotRequest[]> {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from("pilot_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending pilot requests:", error)
    return []
  }

  return requests || []
}

// Validation schema for updating pilot request status
const updatePilotRequestStatusSchema = z.object({
  id: z.string().uuid("Ogiltigt ID"),
  status: z.enum(["pending", "approved", "rejected"]),
})

export type UpdatePilotRequestStatusInput = z.infer<typeof updatePilotRequestStatusSchema>

export async function updatePilotRequestStatus(
  input: UpdatePilotRequestStatusInput
): Promise<{ success: boolean; error?: string; data?: PilotRequest; organizationId?: string }> {
  try {
    // Validate input
    const validatedData = updatePilotRequestStatusSchema.parse(input)

    const supabase = await createClient()

    // Get the pilot request first to access all data
    const { data: pilotRequest, error: fetchError } = await supabase
      .from("pilot_requests")
      .select("*")
      .eq("id", validatedData.id)
      .single()

    if (fetchError || !pilotRequest) {
      console.error("Error fetching pilot request:", fetchError)
      return {
        success: false,
        error: "Kunde inte hämta ansökan. Försök igen.",
      }
    }

    // If approving, create organization automatically
    let organizationId: string | undefined

    if (validatedData.status === "approved") {
      // Check if organization already exists with this org_nr (if provided)
      if (pilotRequest.org_nr) {
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("org_nr", pilotRequest.org_nr)
          .single()

        if (existingOrg) {
          return {
            success: false,
            error: `En organisation med organisationsnummer ${pilotRequest.org_nr} finns redan.`,
          }
        }
      }

      // Create new organization
      // Sprint 6: Copy enrichment_data to business_profile if available
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: pilotRequest.company_name,
          org_nr: pilotRequest.org_nr || null,
          plan_id: null, // No plan selected yet - pilot will choose later
          status: "pilot", // Start as pilot
          business_profile: pilotRequest.enrichment_data 
            ? JSON.stringify(pilotRequest.enrichment_data) 
            : null,
        })
        .select()
        .single()

      if (orgError) {
        console.error("Error creating organization:", orgError)
        return {
          success: false,
          error: "Kunde inte skapa organisation. Försök igen.",
        }
      }

      organizationId = newOrg.id

      // Sprint 9.5: Enrich organization profile and generate feature ideas
      // Fire and forget - don't block the approval flow
      // Run enrichment FIRST, then use that data for feature ideas
      Promise.all([
        import('./enrich-organization'),
        import('./generate-feature-ideas')
      ]).then(async ([enrichModule, featureModule]) => {
        try {
          // Step 1: Enrich organization profile with Google Search
          console.log(`🔍 Enriching organization profile for: ${newOrg.name}`)
          const enrichResult = await enrichModule.enrichOrganizationProfile(newOrg.id)
          
          if (enrichResult.success) {
            console.log(`✅ Organization enriched: ${newOrg.name}`)
            
            // Step 2: Generate feature ideas using BOTH enrichment data sources
            console.log(`🎯 Generating feature ideas for: ${newOrg.name}`)
            await featureModule.generateFeatureIdeas(
              newOrg.id, 
              pilotRequest.enrichment_data as any,
              enrichResult.businessProfile // Pass the enriched profile
            )
          } else {
            console.error('Enrichment failed, generating features with basic data:', enrichResult.error)
            // Fallback: Generate features without enriched profile
            await featureModule.generateFeatureIdeas(newOrg.id, pilotRequest.enrichment_data as any)
          }
        } catch (err) {
          console.error('Failed to enrich/generate features:', err)
        }
      }).catch(err => {
        console.error('Failed to load enrichment modules:', err)
      })
    }

    // Update pilot request status
    const { data, error } = await supabase
      .from("pilot_requests")
      .update({
        status: validatedData.status,
      })
      .eq("id", validatedData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating pilot request:", error)
      return {
        success: false,
        error: "Kunde inte uppdatera status. Försök igen.",
      }
    }

    // Revalidate both pilot requests and organizations pages
    revalidatePath("/pilot-requests")
    revalidatePath("/organizations")
    revalidatePath("/")

    return {
      success: true,
      data: data as PilotRequest,
      organizationId,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

// Upload file to Supabase Storage
export async function uploadPilotFile(
  file: File
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Filen är för stor. Max 10MB tillåtet.",
      }
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Filtyp ej tillåten. Endast PDF, Word, Excel och bilder.",
      }
    }

    const supabase = await createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split(".").pop()
    const fileName = `${timestamp}-${randomString}.${fileExt}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from("pilot-uploads")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Error uploading file:", error)
      return {
        success: false,
        error: "Kunde inte ladda upp fil. Försök igen.",
      }
    }

    return {
      success: true,
      path: data.path,
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

// Get signed URL for downloading file (admin only)
export async function getPilotFileUrl(
  filePath: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    const supabase = await createClient()

    // Create signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from("pilot-uploads")
      .createSignedUrl(filePath, 3600)

    if (error) {
      console.error("Error creating signed URL:", error)
      return {
        success: false,
        error: "Kunde inte hämta fil-URL. Försök igen.",
      }
    }

    return {
      success: true,
      url: data.signedUrl,
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

