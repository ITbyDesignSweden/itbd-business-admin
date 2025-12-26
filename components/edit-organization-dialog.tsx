"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrganization, type UpdateOrganizationInput } from "@/actions/database"
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

interface EditOrganizationDialogProps {
  organization: Organization
}

export function EditOrganizationDialog({ organization }: EditOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"pilot" | "active" | "churned">(
    organization.status as "pilot" | "active" | "churned"
  )
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    const input: UpdateOrganizationInput = {
      id: organization.id,
      name: formData.get("name") as string,
      org_nr: formData.get("org_nr") as string,
      status: status,
      business_profile: formData.get("business_profile") as string,
    }

    const result = await updateOrganization(input)

    if (result.success) {
      toast({
        title: "✅ Organisation uppdaterad!",
        description: `${input.name} har uppdaterats.`,
      })
      setOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "❌ Fel uppstod",
        description: result.error || "Kunde inte uppdatera organisation.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redigera organisation</DialogTitle>
            <DialogDescription>
              Uppdatera organisationens uppgifter. Ändringarna sparas direkt.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Organisationsnamn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="t.ex. Acme AB"
                defaultValue={organization.name}
                required
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org_nr">Organisationsnummer</Label>
              <Input
                id="org_nr"
                name="org_nr"
                placeholder="t.ex. 556123-4567"
                defaultValue={organization.org_nr || ""}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "pilot" | "active" | "churned")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Välj status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pilot">Pilot</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="churned">Avslutad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business_profile">Affärsprofil</Label>
              <Textarea
                id="business_profile"
                name="business_profile"
                placeholder="Beskriv verksamheten, bransch och användningsområde för AI-kontext..."
                defaultValue={organization.business_profile || ""}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Används för att ge AI:n kontext om kundens verksamhet
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

