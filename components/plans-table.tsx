"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Power, Trash2 } from "lucide-react"
import type { SubscriptionPlan } from "@/lib/types/database"
import { EditPlanDialog } from "@/components/edit-plan-dialog"
import { deletePlan, togglePlanStatus } from "@/actions/subscription-plans"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PlansTableProps {
  plans: SubscriptionPlan[]
}

export function PlansTable({ plans }: PlansTableProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    const newStatus = !plan.is_active
    const result = await togglePlanStatus({
      id: plan.id,
      is_active: newStatus,
    })

    if (result.success) {
      toast({
        title: "Status uppdaterad",
        description: `Planen "${plan.name}" är nu ${newStatus ? "aktiv" : "inaktiv"}.`,
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte uppdatera status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return

    setIsDeleting(true)
    const result = await deletePlan({ id: planToDelete.id })

    if (result.success) {
      toast({
        title: "Plan raderad",
        description: `Planen "${planToDelete.name}" har raderats.`,
      })
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte radera plan.",
        variant: "destructive",
      })
    }
    setIsDeleting(false)
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "—"
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Inga planer finns ännu.</p>
        <p className="text-sm text-muted-foreground">Skapa din första plan för att komma igång.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Krediter/månad</TableHead>
              <TableHead>Pris</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.monthly_credits} krediter</TableCell>
                <TableCell>{formatPrice(plan.price)}</TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                      Inaktiv
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditPlanDialog plan={plan}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </EditPlanDialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(plan)}
                    >
                      <Power className={`h-4 w-4 ${plan.is_active ? "text-amber-500" : "text-emerald-500"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(plan)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer permanent radera planen &quot;{planToDelete?.name}&quot;. 
              Detta går inte att ångra. Om planen används av organisationer måste du inaktivera den istället.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Raderar..." : "Radera plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

