"use server"

/**
 * Debug helper för att verifiera GitHub konfiguration
 */
export async function debugGitHubConfig() {
  const token = process.env.GITHUB_ACCESS_TOKEN
  const owner = process.env.GITHUB_TEMPLATE_OWNER
  const repo = process.env.GITHUB_TEMPLATE_REPO

  console.log("=== GitHub Configuration Debug ===")
  console.log("Token exists:", !!token)
  console.log("Token length:", token?.length || 0)
  console.log("Template Owner:", owner)
  console.log("Template Repo:", repo)

  if (!token) {
    return {
      success: false,
      error: "GITHUB_ACCESS_TOKEN saknas i miljövariabler",
    }
  }

  try {
    // Test 1: Verify token validity
    console.log("\n[Test 1] Verifying token...")
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    })

    if (!userResponse.ok) {
      console.error("Token verification failed:", userResponse.status)
      return {
        success: false,
        error: `GitHub token är ogiltigt (${userResponse.status})`,
      }
    }

    const userData = await userResponse.json()
    console.log("✅ Token is valid for user:", userData.login)

    // Test 2: Check if template repo exists and is accessible
    console.log(`\n[Test 2] Checking template repo: ${owner}/${repo}...`)
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    )

    if (!repoResponse.ok) {
      const errorData = await repoResponse.json().catch(() => ({}))
      console.error("Template repo check failed:", repoResponse.status, errorData)
      
      if (repoResponse.status === 404) {
        return {
          success: false,
          error: `Template repository '${owner}/${repo}' finns inte eller du har inte access till det. Kontrollera att:\n1. Repository namnet är korrekt stavat\n2. Repository är public ELLER din token har access till private repos\n3. Du är medlem i organisationen (om det är en org-repo)`,
        }
      }

      return {
        success: false,
        error: `Kunde inte nå template repo (${repoResponse.status})`,
      }
    }

    const repoData = await repoResponse.json()
    console.log("✅ Template repo exists:", repoData.full_name)
    console.log("   - Is template:", repoData.is_template)
    console.log("   - Is private:", repoData.private)
    console.log("   - Owner type:", repoData.owner.type)

    if (!repoData.is_template) {
      return {
        success: false,
        error: `Repository '${owner}/${repo}' är inte markerat som en template. Gå till repo settings på GitHub och aktivera "Template repository".`,
      }
    }

    // Test 3: Check permissions
    console.log("\n[Test 3] Checking permissions...")
    const permissionsResponse = await fetch(
      `https://api.github.com/user/repos?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    )

    const scopes = permissionsResponse.headers.get("x-oauth-scopes")
    console.log("   - Token scopes:", scopes)

    return {
      success: true,
      message: `✅ All checks passed!\nUser: ${userData.login}\nTemplate: ${repoData.full_name}\nIs Template: ${repoData.is_template}\nScopes: ${scopes}`,
    }
  } catch (error) {
    console.error("Debug error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Okänt fel",
    }
  }
}

