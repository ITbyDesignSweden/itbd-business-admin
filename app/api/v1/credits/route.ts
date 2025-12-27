import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"

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
    // 1. Validate API key using shared logic
    const auth = await validateApiKey(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { 
          error: auth.error,
          message: auth.message
        },
        { status: auth.status }
      )
    }

    // 2. Rate limiting (use keyHash from auth result)
    if (isRateLimited(auth.keyHash)) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later."
        },
        { status: 429 }
      )
    }

    // 3. Fetch organization data
    // We need to use service_role key here to bypass RLS
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Fetch organization data with credits and plan
    const { data: orgData, error: orgError } = await supabase
      .from("organizations_with_credits")
      .select("*")
      .eq("id", auth.orgId)
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

