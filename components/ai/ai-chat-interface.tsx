"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AIChatMessage } from "./ai-chat-message"
import { AIChatInput, Attachment } from "./ai-chat-input"
import { cn } from "@/lib/utils"
import { Bot, Loader2 } from "lucide-react"

export interface AIChatInterfaceProps {
  messages: any[]
  status: string
  sendMessage: (options: { text: string }, metadata?: any) => void
  extraBody?: Record<string, any>
  storagePathIdentifier?: string
  placeholder?: string
  assistantIcon?: React.ReactNode
  assistantName?: string
  className?: string
  showWelcome?: boolean
  welcomeTitle?: string
  welcomeMessage?: string
  allowAttachments?: boolean
  error?: any
}

export function AIChatInterface({
  messages,
  status,
  sendMessage,
  extraBody = {},
  storagePathIdentifier,
  placeholder,
  assistantIcon,
  assistantName,
  className,
  showWelcome = true,
  welcomeTitle = "Välkommen!",
  welcomeMessage = "Hur kan jag hjälpa dig idag?",
  allowAttachments = true,
  error
}: AIChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll till botten när nya meddelanden kommer
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, status])

  const handleSend = (text: string, attachments: Attachment[]) => {
    let messageText = text
    
    // Om vi har bilagor, lägg till en notering i texten (valfritt, men bra för historik)
    if (attachments.length > 0) {
      messageText = `${messageText}\n\n[Bifogade filer/bilder: ${attachments.map(a => a.name).join(', ')}]`.trim()
    }

    console.log("AIChatInterface: Sending message with body keys:", Object.keys(extraBody))

    sendMessage(
      { text: messageText },
      {
        body: {
          ...extraBody,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      }
    )
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0 overflow-hidden", className)}>
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.length === 0 && showWelcome && (
            <div className="text-center py-8 px-4">
              <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50 flex items-center justify-center bg-primary/5 rounded-full">
                {assistantIcon || <Bot className="h-6 w-6" />}
              </div>
              <h4 className="font-medium mb-2">{welcomeTitle}</h4>
              <p className="text-sm text-muted-foreground">{welcomeMessage}</p>
            </div>
          )}

          {messages.map((message) => (
            <AIChatMessage 
              key={message.id} 
              message={message} 
              assistantIcon={assistantIcon}
              assistantName={assistantName}
            />
          ))}

          {/* Visa laddnings-indikator om vi väntar på första svaret */}
          {isLoading && !messages.some(m => m.role === 'assistant' && (m.parts?.length || m.content)) && (
            <div className="flex gap-3 text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {assistantIcon || <Bot className="h-4 w-4 text-primary" />}
              </div>
              <div className="rounded-lg px-4 py-2.5 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-2">
              <p className="text-xs text-destructive">
                Ett fel uppstod. Försök igen.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <AIChatInput 
        onSend={handleSend} 
        isLoading={isLoading} 
        placeholder={placeholder}
        projectId={storagePathIdentifier}
        allowAttachments={allowAttachments}
      />
    </div>
  )
}

