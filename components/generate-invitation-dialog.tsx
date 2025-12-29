'use client'

/**
 * Sprint 8.6: Generate Invitation Link Dialog
 * 
 * Admin UI component to generate secure invitation tokens for onboarding.
 * Displays the generated link and provides copy-to-clipboard functionality.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInvitation } from '@/actions/invitations'
import { toast } from 'sonner'
import { Link2, Copy, Check, Loader2 } from 'lucide-react'

interface GenerateInvitationDialogProps {
  orgId: string
  orgName: string
}

export function GenerateInvitationDialog({ orgId, orgName }: GenerateInvitationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await createInvitation(orgId)
      setInvitationUrl(result.url)
      toast.success('Inbjudningslänk skapad!', {
        description: 'Länken är giltig i 30 dagar.'
      })
    } catch (error) {
      console.error('Error generating invitation:', error)
      toast.error('Kunde inte skapa inbjudningslänk', {
        description: error instanceof Error ? error.message : 'Ett oväntat fel uppstod'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!invitationUrl) return
    
    try {
      await navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      toast.success('Länk kopierad!', {
        description: 'Inbjudningslänken har kopierats till urklipp.'
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Kunde inte kopiera länk')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // Reset state when dialog closes
    if (!newOpen) {
      setInvitationUrl(null)
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link2 className="h-4 w-4" />
          Skapa Inbjudningslänk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Skapa Säker Inbjudningslänk</DialogTitle>
          <DialogDescription>
            Generera en kryptografiskt säker länk för <strong>{orgName}</strong> att komma åt onboarding-rummet.
            Länken är giltig i 30 dagar.
          </DialogDescription>
        </DialogHeader>

        {!invitationUrl ? (
          <div className="py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Klicka på knappen nedan för att skapa en ny inbjudningslänk.
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Generera Länk
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invitation-url">Inbjudningslänk</Label>
              <div className="flex gap-2">
                <Input
                  id="invitation-url"
                  value={invitationUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">📋 Nästa steg:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Kopiera länken ovan</li>
                <li>Skicka den till kunden via e-post eller annan säker kanal</li>
                <li>Kunden kan använda länken för att komma åt sitt onboarding-rum</li>
              </ol>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                ⚠️ Säkerhetsnotering
              </p>
              <p className="text-amber-600/80 dark:text-amber-400/80">
                Länken ger tillgång till företagets onboarding-rum. Dela endast med behöriga personer.
                Länken går ut automatiskt efter 30 dagar.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {invitationUrl && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Stäng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


