"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Sparkles, Loader2, MessageSquare } from "lucide-react"
import type { FeatureIdea } from "@/lib/types/database"

interface PromptStartersProps {
  orgId: string
  featureIdeas: FeatureIdea[]
  onPromptClick?: (prompt: string, title: string) => void
}

export function PromptStarters({ orgId, featureIdeas, onPromptClick }: PromptStartersProps) {
  // Sprint 9.5: Data is now fetched server-side and passed as props
  const hasIdeas = featureIdeas && featureIdeas.length > 0

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Kom igång
      </h2>
      <div className="space-y-3">
        {!hasIdeas ? (
          // No ideas available - show fallback message
          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">
                    Inga förslag tillgängliga än
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vi kunde inte generera personliga förslag. Använd chatten för att berätta om era behov så hjälper vi er komma igång!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Loaded state with AI-generated suggestions from database
          <>
            {featureIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-accent/50"
                onClick={() => onPromptClick?.(idea.prompt, idea.title)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary transition-all group-hover:from-primary group-hover:to-primary group-hover:scale-105">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {idea.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {idea.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}


