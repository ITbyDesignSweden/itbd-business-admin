"use client"

import { useState } from "react"
import { Loader2, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { provisionRepository } from "@/actions/provisioning"
import { useToast } from "@/components/ui/use-toast"

interface ProvisionRepositoryButtonProps {
  orgId: string
  orgName: string
}

export function ProvisionRepositoryButton({ orgId, orgName }: ProvisionRepositoryButtonProps) {
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  async function handleProvision() {
    setIsProvisioning(true)

    try {
      const result = await provisionRepository({
        orgId,
        orgName,
      })

      if (result.success) {
        toast({
          title: "✅ Repository skapat!",
          description: `GitHub-repository har provisionerats för ${orgName}.`,
        })
        setOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "❌ Fel uppstod",
          description: result.error || "Kunde inte skapa repository.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Något gick fel",
        description: error instanceof Error ? error.message : "Okänt fel",
      })
    } finally {
      setIsProvisioning(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isProvisioning}>
          {isProvisioning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Provisioning...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Skapa Repository
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Provision GitHub Repository?</AlertDialogTitle>
          <AlertDialogDescription>
            Detta kommer att skapa ett nytt privat repository från din template för{" "}
            <span className="font-semibold">{orgName}</span>.
            <br />
            <br />
            Repository-namnet blir: <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-saas
            </code>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProvisioning}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handleProvision} disabled={isProvisioning}>
            {isProvisioning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisioning...
              </>
            ) : (
              "Skapa Repository"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

