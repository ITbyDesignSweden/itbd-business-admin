"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { generatePromptStarters, type PromptStartersResult } from "@/actions/ai-sdr"

interface PromptStartersProps {
  orgId: string
  onPromptClick?: (prompt: string, title: string) => void
}

export function PromptStarters({ orgId, onPromptClick }: PromptStartersProps) {
  const [data, setData] = useState<PromptStartersResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStarters() {
      try {
        setIsLoading(true)
        const result = await generatePromptStarters(orgId)
        
        if (!isMounted) return
        
        if (result.success && result.data) {
          setData(result.data)
          setError(null)
        } else {
          setError(result.error || "Kunde inte generera förslag")
        }
      } catch (err) {
        if (!isMounted) return
        setError("Ett oväntat fel uppstod")
        console.error("Error loading prompt starters:", err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadStarters()

    return () => {
      isMounted = false
    }
  }, [orgId])

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Kom igång
      </h2>
      <div className="space-y-3">
        {isLoading ? (
          // Skeleton loading state
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-secondary rounded w-3/4"></div>
                      <div className="h-4 bg-secondary rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : error ? (
          // Error state
          <Card className="border-destructive/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 text-sm text-destructive">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Loaded state with AI-generated suggestions
          <>
            {data?.suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-accent/50"
                onClick={() => onPromptClick?.(suggestion.prompt, suggestion.title)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary transition-all group-hover:from-primary group-hover:to-primary group-hover:scale-105">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {suggestion.description}
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

