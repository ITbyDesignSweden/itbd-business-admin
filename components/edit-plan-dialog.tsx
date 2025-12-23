"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePlan } from "@/actions/subscription-plans"
import { useToast } from "@/components/ui/use-toast"
import type { SubscriptionPlan } from "@/lib/types/database"

interface EditPlanDialogProps {
  plan: SubscriptionPlan
  children?: React.ReactNode
}

export function EditPlanDialog({ plan, children }: EditPlanDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: plan.name,
    monthly_credits: plan.monthly_credits.toString(),
    price: plan.price?.toString() || "",
    is_active: plan.is_active,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await updatePlan({
      id: plan.id,
      name: formData.name,
      monthly_credits: parseInt(formData.monthly_credits, 10),
      price: formData.price ? parseInt(formData.price, 10) : null,
      is_active: formData.is_active,
    })

    if (result.success) {
      toast({
        title: "Plan uppdaterad",
        description: `Planen "${formData.name}" har uppdaterats.`,
      })
      setOpen(false)
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte uppdatera plan.",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setFormData({
        name: plan.name,
        monthly_credits: plan.monthly_credits.toString(),
        price: plan.price?.toString() || "",
        is_active: plan.is_active,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || <Button>Redigera plan</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redigera plan</DialogTitle>
            <DialogDescription>
              Uppdatera detaljer för planen &quot;{plan.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Plannamn *</Label>
              <Input
                id="edit-name"
                placeholder="t.ex. Growth"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-monthly_credits">Krediter per månad *</Label>
              <Input
                id="edit-monthly_credits"
                type="number"
                placeholder="t.ex. 50"
                min="0"
                value={formData.monthly_credits}
                onChange={(e) => setFormData({ ...formData, monthly_credits: e.target.value })}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Hur många krediter som läggs till varje månad.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Pris (SEK/månad)</Label>
              <Input
                id="edit-price"
                type="number"
                placeholder="t.ex. 15000"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Månadspris i kronor. Frivilligt för nu.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sparar..." : "Spara ändringar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

