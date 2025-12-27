import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type ApiAuthResult = 
  | { success: true; orgId: string; keyHash: string }
  | { success: false; error: string; status: number; message?: string };

/**
 * Validates an API key from the Authorization header.
 * Handles extraction, hashing, database verification, and updating 'last_used_at'.
 */
export async function validateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { 
      success: false, 
      error: "Missing or invalid Authorization header", 
      message: "Please provide a valid API key in the format: Authorization: Bearer <your-api-key>",
      status: 401 
    };
  }

  const apiKey = authHeader.substring(7);
  if (!apiKey || apiKey.trim() === "") {
    return { success: false, error: "API key is empty", status: 401 };
  }

  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables for API auth");
    return { success: false, error: "Internal server error", status: 500 };
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

  // Look up the API key
  const { data: apiKeyData, error: keyError } = await supabase
    .from("api_keys")
    .select("id, org_id, is_active")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (keyError || !apiKeyData) {
    return { 
      success: false, 
      error: "Invalid API key", 
      message: "The provided API key is invalid or has been revoked.",
      status: 401 
    };
  }

  // Update last_used_at timestamp (fire and forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyData.id)
    .then();

  return { success: true, orgId: apiKeyData.org_id, keyHash };
}

