// Supabase Edge Function: Subscription Refill Cron Job
// Feature N: The Refill Engine (Automation)
//
// Purpose: Trigger daily to refill credits for organizations with active subscriptions
// Security: Only callable with service_role key (set in cron configuration)
// Execution: Should run daily at midnight UTC via cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for development/testing
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RefillResult {
  success: boolean;
  execution_id?: string;
  organizations_processed?: number;
  credits_added?: number;
  duration_ms?: number;
  errors?: string[];
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Security: Verify authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role
    // This bypasses RLS and has full database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Additional security: Check if caller is using service role key
    // (cron jobs will use service role key automatically)
    const bearerToken = authHeader.replace("Bearer ", "");
    if (bearerToken !== supabaseServiceKey) {
      console.warn("Unauthorized refill attempt with non-service-role key");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized. This endpoint requires service_role access." 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🚀 Starting subscription refill process...");

    // Call the database function that handles all the logic
    const { data, error } = await supabase.rpc("process_subscription_refills");

    if (error) {
      console.error("❌ Refill process failed:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = data as RefillResult;

    console.log("✅ Refill process completed:", {
      organizations: result.organizations_processed,
      credits: result.credits_added,
      duration: `${result.duration_ms}ms`,
      errors: result.errors?.length || 0,
    });

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription refill completed successfully",
        ...result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


