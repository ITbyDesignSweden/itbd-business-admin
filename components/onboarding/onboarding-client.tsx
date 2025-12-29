"use client"

import { DefaultChatTransport } from "ai"
import { PromptStarters } from "./prompt-starters"
import { SDRChat } from "./sdr-chat"
import { useChat } from "@ai-sdk/react"
import { toast } from "sonner"

interface OnboardingClientProps {
  orgId: string
}

export function OnboardingClient({ orgId }: OnboardingClientProps) {
  const chat = useChat({
    transport: new DefaultChatTransport({
        api: '/api/onboarding-chat',
      }),
    body: {
      orgId,
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
          orgId,
        },
      }
    )
  }

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PromptStarters orgId={orgId} onPromptClick={handlePromptClick} />
      <SDRChat chat={chat} orgId={orgId} />
    </div>
  )
}
