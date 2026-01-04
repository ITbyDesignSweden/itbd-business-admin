"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Check, Loader2, Rocket } from "lucide-react"
import { toast } from "sonner"
import { acceptProposal } from "@/actions/handshake"

export interface ProposalData {
  title: string
  summary: string
  complexity: 'small' | 'medium'
  key_features: string[]
  estimated_credits: number
  estimated_price_sek: number
  // Sprint 11: Hidden fields for technical handover (not displayed in UI)
  related_feature_id?: string | null
  technical_spec: string
}

interface ProposalCardProps {
  proposal: ProposalData
  token: string
}

const complexityLabels = {
  small: { label: 'Small', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', time: '1-5 dagar' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', time: '1-2 veckor' },
}

export function ProposalCard({ proposal, token }: ProposalCardProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)

  const complexityInfo = complexityLabels[proposal.complexity]

  const handleAccept = async () => {
    setIsAccepting(true)

    try {
      const result = await acceptProposal(token, proposal)

      if (result.success) {
        setIsAccepted(true)
        toast.success("Pilotprojekt startat!", {
          description: "Kolla din e-post för inloggningsuppgifter."
        })
      } else {
        toast.error("Kunde inte starta projekt", {
          description: result.error || "Försök igen eller kontakta support."
        })
      }
    } catch (error) {
      console.error('Error accepting proposal:', error)
      toast.error("Ett tekniskt fel uppstod", {
        description: "Kontakta hello@itbydesign.se för hjälp."
      })
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden py-0">
      <CardHeader className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 pb-2 py-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {proposal.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground">Sammanfattning</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {proposal.summary}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground">Ingår i projektet</h4>
          <ul className="space-y-1.5">
            {(proposal.key_features || []).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
            {(!proposal.key_features || proposal.key_features.length === 0) && (
              <li className="text-sm text-muted-foreground italic">
                Inga specifika funktioner angivna.
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 flex-col gap-3 pt-4">
        {!isAccepted ? (
          <>
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              size="lg"
              className="w-full font-semibold"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skapar projekt...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Starta Pilotprojekt
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              När pilotprojektet byggts färdigt kommer du att få en inloggningsinbjudan till din e-post.
            </p>
          </>
        ) : (
          <div className="w-full text-center py-2">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Projekt startat!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Kolla din e-post för inloggningsuppgifter
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
