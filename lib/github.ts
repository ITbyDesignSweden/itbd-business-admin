/**
 * GitHub API Helper
 * Handles repository provisioning from templates
 */

interface CreateRepoFromTemplateParams {
  templateOwner: string
  templateRepo: string
  newRepoName: string
  description?: string
  isPrivate?: boolean
}

interface CreateRepoResponse {
  success: boolean
  repoUrl?: string
  error?: string
}

/**
 * Creates a new repository from a template using GitHub API
 * @see https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template
 */
export async function createRepoFromTemplate({
  templateOwner,
  templateRepo,
  newRepoName,
  description,
  isPrivate = true,
}: CreateRepoFromTemplateParams): Promise<CreateRepoResponse> {
  const token = process.env.GITHUB_ACCESS_TOKEN

  if (!token) {
    return {
      success: false,
      error: "GitHub Access Token saknas i miljövariabler",
    }
  }

  try {
    const apiUrl = `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`
    console.log(`[GitHub] Attempting to create repo from template: ${templateOwner}/${templateRepo}`)
    console.log(`[GitHub] New repo name: ${newRepoName}`)
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner: templateOwner,
        name: newRepoName,
        description: description || `SaaS instance for ${newRepoName}`,
        private: isPrivate,
        include_all_branches: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("GitHub API error:", errorData)
      console.error(`GitHub API URL: ${apiUrl}`)
      
      if (response.status === 401) {
        return {
          success: false,
          error: "GitHub-autentisering misslyckades. Kontrollera Access Token.",
        }
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: `Template repository '${templateOwner}/${templateRepo}' kunde inte hittas. Kontrollera att repot existerar och att din GitHub token har access till det.`,
        }
      }
      
      if (response.status === 422) {
        return {
          success: false,
          error: "Repository med detta namn finns redan eller ogiltig templateName.",
        }
      }

      return {
        success: false,
        error: `GitHub API returnerade fel: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      repoUrl: data.html_url,
    }
  } catch (error) {
    console.error("Error creating repo from template:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Okänt fel vid repository-skapande",
    }
  }
}

/**
 * Validates that a GitHub Personal Access Token has the required permissions
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    })

    return response.ok
  } catch {
    return false
  }
}

