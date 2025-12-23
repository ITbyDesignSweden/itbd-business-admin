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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlayCircle } from "lucide-react"
import { startSubscription } from "@/actions/database"
import { useToast } from "@/components/ui/use-toast"
import type { SubscriptionPlan } from "@/lib/types/database"

interface StartSubscriptionDialogProps {
  organizationId: string
  organizationName: string
  availablePlans: SubscriptionPlan[]
  children?: React.ReactNode
}

export function StartSubscriptionDialog({
  organizationId,
  organizationName,
  availablePlans,
  children,
}: StartSubscriptionDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get today's date in YYYY-MM-DD format for input default
  const today = new Date().toISOString().split("T")[0]
  
  const [formData, setFormData] = useState({
    planId: "",
    startDate: today,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.planId) {
      toast({
        title: "Fel",
        description: "Vänligen välj en plan.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await startSubscription({
      orgId: organizationId,
      planId: formData.planId,
      startDate: formData.startDate,
    })

    if (result.success) {
      const selectedPlan = availablePlans.find((p) => p.id === formData.planId)
      toast({
        title: "Prenumeration startad",
        description: `${organizationName} har nu en aktiv prenumeration på planen "${selectedPlan?.name}".`,
      })
      setOpen(false)
      setFormData({ planId: "", startDate: today })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte starta prenumeration.",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  const selectedPlan = availablePlans.find((p) => p.id === formData.planId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <PlayCircle className="mr-2 h-4 w-4" />
            Starta prenumeration
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Starta prenumeration</DialogTitle>
            <DialogDescription>
              Välj en plan och startdatum för {organizationName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan">Prenumerationsplan *</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData({ ...formData, planId: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Välj en plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {plan.monthly_credits} krediter/månad
                      {plan.price && ` (${new Intl.NumberFormat("sv-SE", {
                        style: "currency",
                        currency: "SEK",
                        maximumFractionDigits: 0,
                      }).format(plan.price)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan && (
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.monthly_credits} krediter läggs till automatiskt varje månad.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Startdatum *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Nästa påfyllning kommer att ske en månad från startdatumet.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.planId}>
              {isSubmitting ? "Startar..." : "Starta prenumeration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

