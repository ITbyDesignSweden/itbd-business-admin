"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PilotRequest, PilotRequestAttachment, PilotRequestWithAttachments } from "@/lib/types/database"

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
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: pilotRequest.company_name,
          org_nr: pilotRequest.org_nr || null,
          subscription_plan: null, // No plan selected yet - pilot will choose later
          status: "pilot", // Start as pilot
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

