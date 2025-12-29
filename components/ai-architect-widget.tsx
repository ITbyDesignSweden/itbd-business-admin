"use client"

import { useState, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { Bot, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSchemaContext } from "@/actions/schema-context"
import { DefaultChatTransport } from 'ai';
import { AIChatInterface } from "@/components/ai/ai-chat-interface"

interface AiArchitectWidgetProps {
  projectId: string
  apiUrl?: string
  authToken?: string
}

export function AiArchitectWidget({ 
  projectId, 
  apiUrl = "/api/chat",
  authToken
}: AiArchitectWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [schemaContext, setSchemaContext] = useState<string>("")

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }),
    onData: (dataPart: any) => {
      // Fånga upp transienta notifikationer från servern
      if (dataPart.type === 'data-notification') {
        const { message, level } = (dataPart as any).data;
        if (level === 'success') toast.success(message);
        else if (level === 'error') toast.error(message);
        else if (level === 'warning') toast.warning(message);
        else toast.info(message);
      }
    },
    onError: (error: Error) => {
      console.error("Chat error:", error)
      if (error.message.includes("401")) {
        toast.error("Ogiltig behörighet", {
          description: "Kunde inte verifiera ditt projekt-ID."
        })
      } else {
        toast.error("Ett fel uppstod", {
          description: "Försök igen om en stund."
        })
      }
    },
  } as any)

  const { messages, sendMessage, status, error } = chat

  // Fetch schema context on mount
  useEffect(() => {
    async function loadSchema() {
      try {
        const schema = await getSchemaContext()
        setSchemaContext(schema)
        console.log("Schema context loaded")
      } catch (error) {
        console.error("Failed to load schema context:", error)
        // Continue without schema - AI will work with limited context
      }
    }
    loadSchema()
  }, [])
  
  const handleClearChat = () => {
    if (confirm("Vill du verkligen rensa konversationen?")) {
      window.location.reload()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label="Öppna AI Architect"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[400px] h-[600px] p-0 flex flex-col overflow-hidden shadow-2xl border-border"
          align="end"
          side="top"
          sideOffset={10}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">ITBD Intelligent Architect</h3>
                <p className="text-xs text-muted-foreground">Lösningsarkitekt</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Standardized Chat Interface */}
          <div className="flex-1 min-h-0 flex flex-col">
            <AIChatInterface
              messages={messages}
              status={status}
              sendMessage={(options, config) => {
                sendMessage(options, {
                  ...config,
                  body: {
                    ...config?.body,
                    projectId,
                    schema: schemaContext,
                  },
                })
              }}
              storagePathIdentifier={projectId}
              placeholder="Berätta vad du vill bygga..."
              assistantIcon={<Bot className="h-4 w-4 text-primary" />}
              assistantName="ITBD Architect"
              welcomeTitle="Välkommen!"
              welcomeMessage="Jag hjälper dig utöka din plattform med nya funktioner. Berätta vad du vill bygga!"
              allowAttachments={true}
              error={error}
              className="flex-1"
            />
            
            {messages.length > 0 && (
              <div className="px-4 pb-4 bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleClearChat}
                >
                  Rensa konversation
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

