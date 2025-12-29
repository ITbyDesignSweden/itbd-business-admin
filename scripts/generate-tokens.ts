/**
 * Sprint 8: Token Generation Script
 * 
 * This script generates invitation tokens for existing organizations
 * and outputs the URLs for easy distribution.
 * 
 * Usage:
 *   npx tsx scripts/generate-tokens.ts
 * 
 * Or with filters:
 *   npx tsx scripts/generate-tokens.ts --status=pilot
 *   npx tsx scripts/generate-tokens.ts --org-id=<uuid>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Organization {
  id: string
  name: string
  status: string
}

async function generateTokens() {
  console.log('🚀 Starting token generation...\n')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const statusFilter = args.find(arg => arg.startsWith('--status='))?.split('=')[1]
  const orgIdFilter = args.find(arg => arg.startsWith('--org-id='))?.split('=')[1]

  // Build query
  let query = supabase.from('organizations').select('id, name, status')

  if (statusFilter) {
    console.log(`📋 Filtering by status: ${statusFilter}`)
    query = query.eq('status', statusFilter)
  }

  if (orgIdFilter) {
    console.log(`📋 Filtering by org_id: ${orgIdFilter}`)
    query = query.eq('id', orgIdFilter)
  }

  // Fetch organizations
  const { data: organizations, error: orgError } = await query

  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError)
    process.exit(1)
  }

  if (!organizations || organizations.length === 0) {
    console.log('ℹ️  No organizations found matching criteria')
    process.exit(0)
  }

  console.log(`📊 Found ${organizations.length} organization(s)\n`)

  const results: Array<{
    org: Organization
    token: string
    url: string
    error?: string
  }> = []

  // Generate tokens
  for (const org of organizations) {
    console.log(`Processing: ${org.name}...`)

    const { data: token, error: tokenError } = await supabase
      .from('invitation_tokens')
      .insert({ org_id: org.id })
      .select('token')
      .single()

    if (tokenError) {
      console.error(`  ❌ Error: ${tokenError.message}`)
      results.push({
        org,
        token: '',
        url: '',
        error: tokenError.message
      })
      continue
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${baseUrl}/onboarding?token=${token.token}`

    console.log(`  ✅ Token generated`)
    results.push({
      org,
      token: token.token,
      url
    })
  }

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📋 INVITATION LINKS SUMMARY')
  console.log('='.repeat(80) + '\n')

  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.org.name}`)
      console.log(`   Error: ${result.error}\n`)
    } else {
      console.log(`✅ ${result.org.name} (${result.org.status})`)
      console.log(`   Token: ${result.token}`)
      console.log(`   URL:   ${result.url}\n`)
    }
  })

  // Generate CSV for easy import to email tool
  console.log('='.repeat(80))
  console.log('📄 CSV FORMAT (for bulk email)')
  console.log('='.repeat(80) + '\n')
  console.log('organization_name,status,invitation_url')
  results.forEach(result => {
    if (!result.error) {
      console.log(`"${result.org.name}","${result.org.status}","${result.url}"`)
    }
  })

  console.log('\n✨ Done!')
  console.log(`Generated ${results.filter(r => !r.error).length} token(s)`)
  console.log(`Failed: ${results.filter(r => r.error).length}`)
}

generateTokens().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})

