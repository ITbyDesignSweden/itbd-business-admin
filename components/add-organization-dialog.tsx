"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Loader2 } from "lucide-react"
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
import { createOrganization, type CreateOrganizationInput } from "@/actions/database"
import { useToast } from "@/components/ui/use-toast"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Skapar...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Skapa Organisation
        </>
      )}
    </Button>
  )
}

export function AddOrganizationDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [orgNr, setOrgNr] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState<"care" | "growth" | "scale">("care")
  const [status, setStatus] = useState<"pilot" | "active" | "churned">("pilot")
  const { toast } = useToast()

  function resetForm() {
    setName("")
    setOrgNr("")
    setSubscriptionPlan("care")
    setStatus("pilot")
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    // Only reset form when closing via Cancel or X (not on successful submit)
    if (!newOpen && name) {
      // If there's content in the form when closing, ask to reset
      resetForm()
    }
  }

  async function handleSubmit(formData: FormData) {
    const input: CreateOrganizationInput = {
      name: name,
      org_nr: orgNr,
      subscription_plan: subscriptionPlan,
      status: status,
    }

    const result = await createOrganization(input)

    if (result.success) {
      toast({
        title: "✅ Organisation skapad!",
        description: `${input.name} har lagts till i systemet.`,
      })
      setOpen(false)
      resetForm()
    } else {
      toast({
        variant: "destructive",
        title: "❌ Fel uppstod",
        description: result.error || "Kunde inte skapa organisation.",
      })
      // Don't reset form on error - keep values so user can correct them
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Lägg till Organisation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Skapa ny organisation</DialogTitle>
            <DialogDescription>
              Lägg till en ny kund i systemet. Fyll i organisationens uppgifter nedan.
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
                required
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org_nr">Organisationsnummer</Label>
              <Input
                id="org_nr"
                name="org_nr"
                placeholder="t.ex. 556123-4567"
                autoComplete="off"
                value={orgNr}
                onChange={(e) => setOrgNr(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscription_plan">
                Subscription Plan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={subscriptionPlan}
                onValueChange={(value) => setSubscriptionPlan(value as "care" | "growth" | "scale")}
              >
                <SelectTrigger id="subscription_plan">
                  <SelectValue placeholder="Välj plan" />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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

