"use server"

import { createRepoFromTemplate } from "@/lib/github"
import { setGitHubRepoUrl } from "@/actions/instances"

interface ProvisionRepositoryParams {
  orgId: string
  orgName: string
}

interface ProvisionRepositoryResponse {
  success: boolean
  repoUrl?: string
  error?: string
}

/**
 * Provisions a new GitHub repository for an organization
 * Uses environment variables for template configuration
 */
export async function provisionRepository({
  orgId,
  orgName,
}: ProvisionRepositoryParams): Promise<ProvisionRepositoryResponse> {
  const templateOwner = process.env.GITHUB_TEMPLATE_OWNER
  const templateRepo = process.env.GITHUB_TEMPLATE_REPO

  // Validate environment variables
  if (!templateOwner || !templateRepo) {
    return {
      success: false,
      error: "GitHub template-konfiguration saknas i miljövariabler",
    }
  }

  // Generate a safe repo name (lowercase, no spaces, no special chars)
  const safeRepoName = orgName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes

  // Create repository from template
  const result = await createRepoFromTemplate({
    templateOwner,
    templateRepo,
    newRepoName: `${safeRepoName}-saas`,
    description: `SaaS instance för ${orgName}`,
    isPrivate: true,
  })

  if (!result.success || !result.repoUrl) {
    return {
      success: false,
      error: result.error || "Kunde inte skapa repository",
    }
  }

  // Update organization with the new repo URL
  const updateResult = await setGitHubRepoUrl(orgId, result.repoUrl)

  if (!updateResult.success) {
    return {
      success: false,
      error: "Repository skapades men kunde inte länkas till organisationen",
    }
  }

  return {
    success: true,
    repoUrl: result.repoUrl,
  }
}

