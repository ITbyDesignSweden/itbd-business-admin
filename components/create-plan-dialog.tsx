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
import { Plus } from "lucide-react"
import { createPlan } from "@/actions/subscription-plans"
import { useToast } from "@/components/ui/use-toast"

export function CreatePlanDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    monthly_credits: "",
    price: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createPlan({
      name: formData.name,
      monthly_credits: parseInt(formData.monthly_credits, 10),
      price: formData.price ? parseInt(formData.price, 10) : null,
      is_active: true,
    })

    if (result.success) {
      toast({
        title: "Plan skapad",
        description: `Planen "${formData.name}" har skapats.`,
      })
      setOpen(false)
      setFormData({ name: "", monthly_credits: "", price: "" })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte skapa plan.",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Skapa plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Skapa ny plan</DialogTitle>
            <DialogDescription>
              Skapa en ny prenumerationsplan med antal krediter och pris.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Plannamn *</Label>
              <Input
                id="name"
                placeholder="t.ex. Growth"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthly_credits">Krediter per månad *</Label>
              <Input
                id="monthly_credits"
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
              <Label htmlFor="price">Pris (SEK/månad)</Label>
              <Input
                id="price"
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
              {isSubmitting ? "Skapar..." : "Skapa plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

