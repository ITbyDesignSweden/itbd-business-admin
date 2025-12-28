"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Rocket, Users, FileText, ChevronRight, LucideIcon } from "lucide-react"

export interface StarterCard {
  id: string
  icon?: LucideIcon
  title: string
  description: string
  prompt?: string
}

interface StarterCardsProps {
  cards?: StarterCard[]
  onCardClick?: (card: StarterCard) => void
}

const defaultCards: StarterCard[] = [
  {
    id: "quick-start",
    icon: Rocket,
    title: "Snabbstart",
    description: "Kom igång direkt med vår guidade setup på under 5 minuter.",
  },
  {
    id: "team-setup",
    icon: Users,
    title: "Bjud in teamet",
    description: "Lägg till kollegor och tilldela roller för att samarbeta effektivt.",
  },
  {
    id: "explore-docs",
    icon: FileText,
    title: "Utforska dokumentation",
    description: "Lär dig mer om alla funktioner och integrationsmöjligheter.",
  },
]

export function StarterCards({ cards = defaultCards, onCardClick }: StarterCardsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kom igång</h2>
      <div className="space-y-3">
        {cards.map((card) => {
          const IconComponent = card.icon || Rocket
          return (
            <Card
              key={card.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-accent/50"
              onClick={() => onCardClick?.(card)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

