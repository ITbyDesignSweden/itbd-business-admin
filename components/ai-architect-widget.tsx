"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Bot, Send, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSchemaContext } from "@/actions/schema-context"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AiArchitectWidgetProps {
  projectId: string
  apiUrl?: string
}

export function AiArchitectWidget({ 
  projectId, 
  apiUrl = "/api/chat" 
}: AiArchitectWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [schemaContext, setSchemaContext] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = useChat({
    // api: apiUrl, // Borttaget då det verkar krocka med vissa typdefinitioner i v6, använder default /api/chat
    onError: (error) => {
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
    onFinish: () => {
      console.log("Message finished")
    },
  })

  const { messages, sendMessage, status, stop, error } = chat

  // Förbättrad helper för att hämta text oavsett format
  const getMessageContent = (message: any) => {
    if (message.content) return message.content;
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("")
    }
    return "";
  };

  // Fetch schema context on mount
  useEffect(() => {
    async function loadSchema() {
      try {
        const schema = await getSchemaContext()
        setSchemaContext(schema)
        console.log("Schema context loaded:", schema)
      } catch (error) {
        console.error("Failed to load schema context:", error)
        // Continue without schema - AI will work with limited context
      }
    }
    loadSchema()
  }, [])

  // Auto-scroll till botten när nya meddelanden kommer
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, status])
  
  // Map status to isLoading for compatibility
  const isLoading = status === 'streaming' || status === 'submitted'
  
  // Debug logging
  console.log("Messages:", messages)
  console.log("Status:", status)
  console.log("Error:", error)

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    const text = inputValue
    setInputValue("") // Rensa input direkt
    
    // Använd sendMessage enligt AI SDK 6 dokumentation
    sendMessage(
      { text },
      {
        body: {
          projectId,
          schema: schemaContext,
        },
      }
    )
  }

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

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h4 className="font-medium mb-2">Välkommen!</h4>
                  <p className="text-sm text-muted-foreground">
                    Jag hjälper dig utöka din plattform med nya funktioner. 
                    Berätta vad du vill bygga!
                  </p>
                </div>
              )}

              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 text-sm mb-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  {/* Rendera bubblan alltid för assistant-meddelanden, även om de är tomma vid första anropet */}
                  {(message.role === "user" || getMessageContent(message) || (message.toolInvocations && message.toolInvocations.length > 0)) && (
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 max-w-[85%] break-words",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {/* Textinnehåll */}
                      {getMessageContent(message) && (
                        <div className={cn(
                          "leading-relaxed text-[13px]",
                          message.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"
                        )}>
                          {message.role === "user" ? (
                            <div className="whitespace-pre-wrap">{getMessageContent(message)}</div>
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                code: ({ children }) => (
                                  <code className="bg-muted-foreground/20 rounded px-1 py-0.5 font-mono text-xs">
                                    {children}
                                  </code>
                                ),
                                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                              }}
                            >
                              {getMessageContent(message)}
                            </ReactMarkdown>
                          )}
                        </div>
                      )}

                      {/* Tool Invocations */}
                      {message.toolInvocations?.map((toolInvocation: any) => {
                        const { toolCallId, state } = toolInvocation;

                        if (state === 'call') {
                          return (
                            <div key={toolCallId} className="flex items-center gap-2 mt-2 text-xs text-muted-foreground italic">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Skapar teknisk specifikation...
                            </div>
                          );
                        }

                        if (state === 'result' && toolInvocation.toolName === 'submit_feature_request') {
                          const { result } = toolInvocation;
                          
                          // Visa kort bekräftelse i UI (detaljerat svar kommer från AI:n)
                          if (result.success) {
                            return (
                              <div key={toolCallId} className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400">
                                ✅ Teknisk specifikation skapad (ID: {result.document_id?.slice(0, 8)}...)
                              </div>
                            );
                          } else {
                            return (
                              <div key={toolCallId} className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-700 dark:text-red-400">
                                ❌ {result.error || 'Fel vid registrering'}
                              </div>
                            );
                          }
                        }

                        return null;
                      })}
                    </div>
                  )}

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        Du
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
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

          {/* Input */}
          <div className="p-4 border-t bg-background shrink-0">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                disabled={isLoading}
                className="flex-1"
                autoComplete="off"
              />
              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={stop}
                  disabled={!isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>

            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={handleClearChat}
              >
                Rensa konversation
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

