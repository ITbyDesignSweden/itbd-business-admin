"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { triggerSubscriptionRefills } from "@/actions/database"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RefillTriggerButtonProps {
  disabled?: boolean
}

export function RefillTriggerButton({ disabled = false }: RefillTriggerButtonProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleTriggerRefill = async () => {
    setIsProcessing(true)

    try {
      const result = await triggerSubscriptionRefills()

      if (result.success && result.data) {
        toast({
          title: "Påfyllning genomförd",
          description: `${result.data.organizations_processed} organisationer fick totalt ${result.data.credits_added} krediter. Tog ${result.data.duration_ms}ms.`,
        })

        if (result.data.errors && result.data.errors.length > 0) {
          toast({
            title: "Varning",
            description: `${result.data.errors.length} fel uppstod under påfyllningen.`,
            variant: "destructive",
          })
        }

        setDialogOpen(false)
      } else {
        toast({
          title: "Fel",
          description: result.error || "Kunde inte köra påfyllning.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || isProcessing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
          Kör påfyllning nu
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kör kreditpåfyllning?</AlertDialogTitle>
          <AlertDialogDescription>
            Detta kommer att omedelbart fylla på krediter för alla organisationer med aktiva prenumerationer 
            som har förfallet påfyllningsdatum. Nästa påfyllningsdatum kommer att uppdateras automatiskt.
            <br /><br />
            Denna åtgärd används normalt automatiskt via cron-jobb. Använd endast manuellt för testning eller 
            om den automatiska påfyllningen misslyckades.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handleTriggerRefill} disabled={isProcessing}>
            {isProcessing ? "Kör påfyllning..." : "Kör påfyllning"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

