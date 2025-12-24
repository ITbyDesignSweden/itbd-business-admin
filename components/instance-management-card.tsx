"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { ExternalLink, Loader2, Pencil, Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateInstanceDetails } from "@/actions/instances"
import { useToast } from "@/components/ui/use-toast"
import type { Organization } from "@/lib/types/database"
import { ProvisionRepositoryButton } from "./provision-repository-button"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sparar...
        </>
      ) : (
        "Spara ändringar"
      )}
    </Button>
  )
}

interface EditInstanceDialogProps {
  organization: Organization
}

function EditInstanceDialog({ organization }: EditInstanceDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    const production_url = formData.get("production_url") as string
    const github_repo_url = formData.get("github_repo_url") as string
    const supabase_project_ref = formData.get("supabase_project_ref") as string

    const result = await updateInstanceDetails(organization.id, {
      production_url: production_url || null,
      github_repo_url: github_repo_url || null,
      supabase_project_ref: supabase_project_ref || null,
    })

    if (result.success) {
      toast({
        title: "✅ Instansdetaljer uppdaterade!",
        description: "Ändringarna har sparats.",
      })
      setOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "❌ Fel uppstod",
        description: result.error || "Kunde inte uppdatera instansdetaljer.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Redigera instansdetaljer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redigera SaaS-instans</DialogTitle>
            <DialogDescription>
              Uppdatera länkar och referenser för kundens SaaS-instans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="production_url">Produktions-URL</Label>
              <Input
                id="production_url"
                name="production_url"
                type="url"
                placeholder="https://kund.example.com"
                defaultValue={organization.production_url || ""}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="github_repo_url">GitHub Repository URL</Label>
              <Input
                id="github_repo_url"
                name="github_repo_url"
                type="url"
                placeholder="https://github.com/org/repo"
                defaultValue={organization.github_repo_url || ""}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supabase_project_ref">Supabase Project Ref</Label>
              <Input
                id="supabase_project_ref"
                name="supabase_project_ref"
                placeholder="xyz123abc456"
                defaultValue={organization.supabase_project_ref || ""}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface InstanceManagementCardProps {
  organization: Organization
}

export function InstanceManagementCard({ organization }: InstanceManagementCardProps) {
  const hasProductionUrl = !!organization.production_url
  const hasGitHubRepo = !!organization.github_repo_url
  const hasSupabaseRef = !!organization.supabase_project_ref
  const hasAnyData = hasProductionUrl || hasGitHubRepo || hasSupabaseRef

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>SaaS-instans</CardTitle>
          <CardDescription>Kundens miljöer och repositories</CardDescription>
        </div>
        <EditInstanceDialog organization={organization} />
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingen instans konfigurerad ännu.
            </p>
            {!hasGitHubRepo && (
              <ProvisionRepositoryButton 
                orgId={organization.id}
                orgName={organization.name}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {hasProductionUrl && (
              <div>
                <Label className="text-xs text-muted-foreground">Produktionsmiljö</Label>
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={organization.production_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    {organization.production_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {hasGitHubRepo && (
              <div>
                <Label className="text-xs text-muted-foreground">GitHub Repository</Label>
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={organization.github_repo_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    <Github className="h-4 w-4" />
                    {organization.github_repo_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {hasSupabaseRef && (
              <div>
                <Label className="text-xs text-muted-foreground">Supabase Project</Label>
                <div className="mt-1">
                  <a
                    href={`https://supabase.com/dashboard/project/${organization.supabase_project_ref}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    {organization.supabase_project_ref}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {!hasGitHubRepo && (
              <div className="pt-2 border-t">
                <ProvisionRepositoryButton 
                  orgId={organization.id}
                  orgName={organization.name}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

