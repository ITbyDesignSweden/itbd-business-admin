"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, PlayCircle, PauseCircle, XCircle, RefreshCw } from "lucide-react"
import type { OrganizationWithCredits, SubscriptionPlan } from "@/lib/types/database"
import { StartSubscriptionDialog } from "@/components/start-subscription-dialog"
import { cancelSubscription, pauseSubscription, resumeSubscription } from "@/actions/database"
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

interface SubscriptionCardProps {
  organization: OrganizationWithCredits
  plan: SubscriptionPlan | null
  availablePlans: SubscriptionPlan[]
}

export function SubscriptionCard({ organization, plan, availablePlans }: SubscriptionCardProps) {
  const { toast } = useToast()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const hasActiveSubscription = organization.subscription_status === "active"
  const isPaused = organization.subscription_status === "paused"
  const isCancelled = organization.subscription_status === "cancelled"
  const isInactive = organization.subscription_status === "inactive"

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    const result = await cancelSubscription({ orgId: organization.id })

    if (result.success) {
      toast({
        title: "Prenumeration avslutad",
        description: "Prenumerationen har avslutats. Inga fler påfyllningar kommer att ske.",
      })
      setCancelDialogOpen(false)
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte avsluta prenumeration.",
        variant: "destructive",
      })
    }
    setIsProcessing(false)
  }

  const handlePauseSubscription = async () => {
    setIsProcessing(true)
    const result = await pauseSubscription({ orgId: organization.id })

    if (result.success) {
      toast({
        title: "Prenumeration pausad",
        description: "Prenumerationen har pausats. Krediter läggs inte till förrän den återupptas.",
      })
      setPauseDialogOpen(false)
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte pausa prenumeration.",
        variant: "destructive",
      })
    }
    setIsProcessing(false)
  }

  const handleResumeSubscription = async () => {
    setIsProcessing(true)
    const result = await resumeSubscription({ orgId: organization.id })

    if (result.success) {
      toast({
        title: "Prenumeration återupptagen",
        description: "Prenumerationen är nu aktiv igen.",
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte återuppta prenumeration.",
        variant: "destructive",
      })
    }
    setIsProcessing(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = () => {
    switch (organization.subscription_status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Aktiv
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pausad
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Avslutad
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Inaktiv
          </Badge>
        )
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Prenumeration</CardTitle>
            <CardDescription>Hantera organisationens prenumerationsplan</CardDescription>
          </div>
          {getStatusBadge()}
        </CardHeader>
        <CardContent className="space-y-4">
          {isInactive || isCancelled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingen aktiv prenumeration. Starta en prenumeration för att automatiskt fylla på krediter varje månad.
              </p>
              <StartSubscriptionDialog
                organizationId={organization.id}
                organizationName={organization.name}
                availablePlans={availablePlans}
              />
            </div>
          ) : (
            <>
              {/* Subscription Details */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Plan</span>
                  </div>
                  <div className="font-medium">{plan?.name || "—"}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span>Krediter/månad</span>
                  </div>
                  <div className="font-medium">{plan?.monthly_credits || 0} krediter</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Startdatum</span>
                  </div>
                  <div className="font-medium">{formatDate(organization.subscription_start_date)}</div>
                </div>
                {hasActiveSubscription && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Nästa påfyllning</span>
                    </div>
                    <div className="font-medium">{formatDate(organization.next_refill_date)}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {hasActiveSubscription && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPauseDialogOpen(true)}
                      disabled={isProcessing}
                    >
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Pausa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Avsluta
                    </Button>
                  </>
                )}
                {isPaused && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeSubscription}
                    disabled={isProcessing}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Återuppta
                  </Button>
                )}
              </div>

              {isPaused && (
                <p className="text-sm text-amber-600">
                  Prenumerationen är pausad. Krediter läggs inte till förrän den återupptas.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avsluta prenumeration?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer avsluta prenumerationen för {organization.name}. Inga fler automatiska kreditpåfyllningar kommer att ske.
              Organisationen behåller sina nuvarande krediter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? "Avslutar..." : "Avsluta prenumeration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pausa prenumeration?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer pausa prenumerationen för {organization.name}. Krediter läggs inte till förrän prenumerationen återupptas.
              Du kan återuppta prenumerationen när som helst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePauseSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "Pausar..." : "Pausa prenumeration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

