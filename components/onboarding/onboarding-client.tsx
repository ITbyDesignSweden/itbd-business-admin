"use client"

/**
 * Sprint 8.5: Security Update
 * Changed from orgId to token-based authentication.
 * Client components now pass token to server actions instead of orgId.
 */

import { DefaultChatTransport } from "ai"
import { PromptStarters } from "./prompt-starters"
import { SDRChat } from "./sdr-chat"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"
import type { FeatureIdea } from "@/lib/types/database"

interface OnboardingClientProps {
  token: string
  featureIdeas: FeatureIdea[]
}

export function OnboardingClient({ token, featureIdeas }: OnboardingClientProps) {
  const chat = useChat({
    transport: new DefaultChatTransport({
        api: '/api/onboarding-chat',
      }),
    body: {
      token,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hej! 👋 Jag är din personliga SDR-assistent och finns här för att hjälpa er komma igång. Berätta gärna lite om era behov så hittar vi rätt lösning tillsammans.",
      },
    ],
    onError: (error: Error) => {
      console.error("Chat error:", error)
      toast.error("Ett fel uppstod i chatten", {
        description: "Försök igen om en stund."
      })
    },
  } as any)


  const handlePromptClick = (prompt: string, title: string) => {
    console.log('Prompt selected:', title)

    chat.sendMessage(
      { text: prompt },
      {
        body: {
          token,
        },
      }
    )
  }

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PromptStarters 
        token={token}
        featureIdeas={featureIdeas}
        onPromptClick={handlePromptClick} 
      />
      <SDRChat chat={chat} token={token} />
    </div>
  )
}
