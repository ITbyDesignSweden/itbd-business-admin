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
  const [subscriptionPlan, setSubscriptionPlan] = useState<"care" | "growth" | "scale" | null>(
    organization.subscription_plan
  )
  const [status, setStatus] = useState<"pilot" | "active" | "churned">(
    organization.status as "pilot" | "active" | "churned"
  )
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    const input: UpdateOrganizationInput = {
      id: organization.id,
      name: formData.get("name") as string,
      org_nr: formData.get("org_nr") as string,
      subscription_plan: subscriptionPlan,
      status: status,
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
              <Label htmlFor="subscription_plan">
                Prenumerationsplan
              </Label>
              <Select
                value={subscriptionPlan || "none"}
                onValueChange={(value) => setSubscriptionPlan(value === "none" ? null : value as "care" | "growth" | "scale")}
              >
                <SelectTrigger id="subscription_plan">
                  <SelectValue placeholder="Välj plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen plan (pilot väljer senare)</SelectItem>
                  <SelectItem value="care">Care (5 000 kr/mån)</SelectItem>
                  <SelectItem value="growth">Growth (15 000 kr/mån)</SelectItem>
                  <SelectItem value="scale">Scale (35 000 kr/mån)</SelectItem>
                </SelectContent>
              </Select>
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

