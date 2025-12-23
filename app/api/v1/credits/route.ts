import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Rate limiting: Simple in-memory store (for production, use Redis or Upstash)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

/**
 * Simple rate limiter
 * Returns true if rate limit is exceeded
 */
function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  record.count++
  return false
}

/**
 * Clean up old rate limit records periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

/**
 * GET /api/v1/credits
 * 
 * Public API endpoint for customers to check their credit balance and plan
 * 
 * Authentication: Bearer token in Authorization header
 * Response: { credits: number, plan: string, status: string }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate Authorization header
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          error: "Missing or invalid Authorization header",
          message: "Please provide a valid API key in the format: Authorization: Bearer <your-api-key>"
        },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove "Bearer " prefix

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { error: "API key is empty" },
        { status: 401 }
      )
    }

    // 2. Rate limiting (use API key as identifier)
    const keyHash = createHash("sha256").update(apiKey).digest("hex")
    
    // DEBUG: Log for troubleshooting
    console.log("🔑 API Key received (first 10 chars):", apiKey.substring(0, 10) + "...")
    console.log("🔐 Key hash:", keyHash)
    console.log("📏 Key length:", apiKey.length)
    
    if (isRateLimited(keyHash)) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later."
        },
        { status: 429 }
      )
    }

    // 3. Verify API key and get organization ID
    // We need to use service_role key here because this is a public endpoint
    // and we need to bypass RLS to look up the API key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }

    // DEBUG: Verify env vars are loaded
    console.log("🌐 Supabase URL:", supabaseUrl)
    console.log("🔑 Service key exists:", !!supabaseServiceKey)
    console.log("🔑 Service key length:", supabaseServiceKey?.length)
    console.log("🔑 Service key starts with:", supabaseServiceKey?.substring(0, 10))

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Look up the API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id, org_id, is_active")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    // DEBUG: Log lookup result
    console.log("🔍 DB Lookup result:", { found: !!apiKeyData, error: keyError?.message })
    if (!apiKeyData) {
      console.log("❌ No matching API key found in database")
    }

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        { 
          error: "Invalid API key",
          message: "The provided API key is invalid or has been revoked."
        },
        { status: 401 }
      )
    }

    // 4. Update last_used_at timestamp (fire and forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id)
      .then(() => {}) // Ignore result

    // 5. Fetch organization data with credits and plan
    const { data: orgData, error: orgError } = await supabase
      .from("organizations_with_credits")
      .select("*")
      .eq("id", apiKeyData.org_id)
      .single()

    if (orgError || !orgData) {
      console.error("Error fetching organization:", orgError)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // 6. Return credit balance and plan information
    return NextResponse.json(
      {
        credits: orgData.total_credits || 0,
        plan: orgData.plan_name || "No Plan",
        status: orgData.status,
        subscription_status: orgData.subscription_status,
        monthly_credits: orgData.plan_monthly_credits || 0,
        next_refill_date: orgData.next_refill_date,
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        }
      }
    )

  } catch (error) {
    console.error("Error in /api/v1/credits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  )
}

