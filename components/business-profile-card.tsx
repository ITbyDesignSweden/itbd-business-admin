"use client"

import { useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { Sparkles, Loader2, Pencil, Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { enrichOrganizationProfile } from "@/actions/enrich-organization"
import { useToast } from "@/components/ui/use-toast"
import type { Organization } from "@/lib/types/database"

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

interface EditWebsiteDialogProps {
  organization: Organization
}

function EditWebsiteDialog({ organization }: EditWebsiteDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    const website_url = formData.get("website_url") as string

    const result = await updateInstanceDetails(organization.id, {
      website_url: website_url || null,
    })

    if (result.success) {
      toast({
        title: "✅ Hemsida uppdaterad!",
        description: "Företagshemsidan har sparats.",
      })
      setOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "❌ Fel uppstod",
        description: result.error || "Kunde inte uppdatera hemsidan.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Redigera hemsida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redigera företagshemsida</DialogTitle>
            <DialogDescription>
              Ange företagets officiella hemsida för att förbättra AI-analysen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="website_url">Företagshemsida</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://foretagetshemsida.se"
                defaultValue={organization.website_url || ""}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Används för att automatiskt hitta information om företaget via Google Search.
              </p>
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

interface BusinessProfileCardProps {
  organization: Organization
}

export function BusinessProfileCard({ organization }: BusinessProfileCardProps) {
  const [isPending, startTransition] = useTransition()
  const [localProfile, setLocalProfile] = useState(organization.business_profile)
  const { toast } = useToast()

  const hasProfile = !!localProfile
  const hasWebsite = !!organization.website_url

  async function handleEnrichProfile() {
    startTransition(async () => {
      toast({
        title: "🔍 Söker på nätet...",
        description: "AI:n använder Google Search för att hitta information om företaget.",
      })

      const result = await enrichOrganizationProfile(organization.id)

      if (result.success && result.businessProfile) {
        setLocalProfile(result.businessProfile)
        toast({
          title: "✨ Profil skapad!",
          description: "Företagsprofilen har genererats automatiskt.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "❌ Fel uppstod",
          description: result.error || "Kunde inte skapa profilen.",
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Företagsprofil</CardTitle>
          <CardDescription>AI-genererad beskrivning för säljstöd</CardDescription>
        </div>
        <EditWebsiteDialog organization={organization} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Website URL Section */}
          {hasWebsite && (
            <div>
              <Label className="text-xs text-muted-foreground">Företagshemsida</Label>
              <div className="mt-1 flex items-center gap-2">
                <a
                  href={organization.website_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  {organization.website_url}
                </a>
              </div>
            </div>
          )}

          {/* Business Profile Section */}
          {hasProfile ? (
            <div>
              <Label className="text-xs text-muted-foreground">AI-genererad profil</Label>
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{localProfile}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed rounded-md text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Ingen företagsprofil skapad ännu. Använd AI för att automatiskt generera en beskrivning.
              </p>
            </div>
          )}

          {/* Auto-Enrich Button */}
          <div className={hasProfile ? "pt-2 border-t" : ""}>
            <Button
              onClick={handleEnrichProfile}
              disabled={isPending}
              variant={hasProfile ? "outline" : "default"}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Söker på nätet...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {hasProfile ? "Uppdatera profil" : "Auto-Enrich Profile"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Använder Google Search + AI för att hitta information om företaget.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

