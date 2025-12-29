"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Bot, Send, X, Loader2, Paperclip, FileIcon, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSchemaContext } from "@/actions/schema-context"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createClient } from "@/lib/supabase/client"
import { DefaultChatTransport } from 'ai';

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
  const [inputValue, setInputValue] = useState("")
  const [schemaContext, setSchemaContext] = useState<string>("")
  const [attachments, setAttachments] = useState<Array<{ name: string, url: string, contentType: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`
    } : undefined,
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
    onFinish: () => {
      console.log("Message finished")
    },
  } as any)

  const { messages, sendMessage, status, stop, error } = chat

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen är för stor", {
        description: "Max filstorlek är 10MB"
      })
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'text/csv', 'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Filtypen stöds inte", {
        description: "Stöder bilder, PDF, text, CSV och Office-dokument (Excel/Word)"
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload to Supabase Storage
      const supabase = createClient()
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error("Kunde inte ladda upp filen", {
          description: uploadError.message
        })
        return
      }

      // Create signed URL (valid for 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(filePath, 3600) // 1 hour

      if (urlError || !urlData) {
        console.error('URL error:', urlError)
        toast.error("Kunde inte skapa länk till filen")
        return
      }

      // Add to attachments
      setAttachments(prev => [...prev, {
        name: file.name,
        url: urlData.signedUrl,
        contentType: file.type
      }])

      toast.success("Fil bifogad", {
        description: file.name
      })

    } catch (error) {
      console.error('File upload error:', error)
      toast.error("Ett fel uppstod vid uppladdning")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return
    
    let messageText = inputValue
    
    // For images, only show the names in the chat UI
    // The actual analysis is handled server-side via the attachments in the body
    if (attachments.length > 0) {
      messageText = `${messageText}\n\n[Bifogade filer/bilder: ${attachments.map(a => a.name).join(', ')}]`.trim()
    }
    
    setInputValue("") // Rensa input direkt
    setAttachments([]) // Clear attachments after sending
    
    // Använd sendMessage enligt AI SDK 6 dokumentation
    // Skicka attachments metadata via body för server-side hantering
    sendMessage(
      { text: messageText },
      {
        body: {
          projectId,
          schema: schemaContext,
          attachments: attachments.length > 0 ? attachments : undefined,
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
                  
                  {/* Rendera bubblan för meddelanden */}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 break-words [word-break:break-word] overflow-hidden",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="space-y-3">
                        {message.parts?.map((part: any, index: number) => {
                          // 1. Rendera Text-delar
                          if (part.type === "text") {
                            return (
                              <div 
                                key={index}
                                className={cn(
                                  "leading-relaxed text-[13px]",
                                  message.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"
                                )}
                              >
                                {message.role === "user" ? (
                                  <div className="whitespace-pre-wrap break-words">{part.text}</div>
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
                                    {part.text}
                                  </ReactMarkdown>
                                )}
                              </div>
                            );
                          }

                          // 2. Rendera Verktygs-delar (Tool Invocations)
                          if (part.type === "tool-invocation") {
                            const { toolInvocation } = part;
                            const { toolCallId, state, toolName } = toolInvocation;

                            if (state === 'call') {
                              return (
                                <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {toolName === 'submit_feature_request' ? 'Skapar teknisk specifikation...' : `Kör ${toolName}...`}
                                </div>
                              );
                            }

                            if (state === 'result' && toolName === 'submit_feature_request') {
                              const { result } = toolInvocation;
                              if (result.success) {
                                return (
                                  <div key={toolCallId} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400">
                                    ✅ Teknisk specifikation skapad (ID: {result.document_id?.slice(0, 8)}...)
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={toolCallId} className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-700 dark:text-red-400">
                                    ❌ {result.error || 'Fel vid registrering'}
                                  </div>
                                );
                              }
                            }
                          }

                          return null;
                        })}

                        {/* Fallback för gamla meddelanden utan parts (bakåtkompatibilitet) */}
                        {!message.parts && message.content && (
                          <div className={cn(
                            "leading-relaxed text-[13px]",
                            message.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"
                          )}>
                            {message.role === "user" ? (
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            ) : (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visa Metadata (Tokens/Model) för assistant-meddelanden */}
                    {message.role === "assistant" && message.metadata && (
                      <div className="px-1 flex items-center gap-2 text-[10px] text-muted-foreground opacity-60">
                        <span>{message.metadata.modelId}</span>
                        {message.metadata.usage && (
                          <span>• {message.metadata.usage.totalTokens} tokens</span>
                        )}
                      </div>
                    )}
                  </div>

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
          <div className="p-4 border-t bg-background shrink-0 space-y-2">
            {/* GDPR Disclaimer */}
            <div className="text-[10px] leading-tight text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded px-2 py-1.5">
              <strong>⚠️ GDPR-notering:</strong> Ladda ej upp känsliga personuppgifter. Bifogade filer raderas automatiskt efter 24 timmar.
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs border"
                  >
                    {att.contentType.startsWith('image/') ? (
                      <ImageIcon className="h-3 w-3 text-blue-500" />
                    ) : (
                      <FileIcon className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.csv,.json,.xlsx,.xls,.docx,.doc"
              />
              
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                title="Bifoga fil (bilder, PDF, Office, text)"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>

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
                  disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
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

