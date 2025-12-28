"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Sparkles, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface SDRChatProps {
  chat: any
  orgId: string
}

export function SDRChat({ chat, orgId }: SDRChatProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = chat
  
  // Map status to isLoading for compatibility with the UI
  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive or status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    const text = inputValue
    setInputValue("")
    
    sendMessage(
      { text },
      {
        body: {
          orgId,
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI-Assistent</h2>
      <Card className="flex flex-col h-[420px]">
        <CardHeader className="border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground text-sm">ITBD SDR</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Redo att hjälpa
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-5 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 text-sm",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%] break-words",
                    message.role === "assistant"
                      ? "bg-secondary rounded-tl-sm text-foreground"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}
                >
                  <div className="space-y-3">
                    {message.parts ? (
                      message.parts.map((part: any, index: number) => {
                        if (part.type === "text") {
                          return (
                            <div 
                              key={index}
                              className={cn(
                                "leading-relaxed text-[13px]",
                                message.role === "assistant" ? "prose prose-sm dark:prose-invert max-w-none" : ""
                              )}
                            >
                              {message.role === "user" ? (
                                <div className="whitespace-pre-wrap">{part.text}</div>
                              ) : (
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                                  }}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })
                    ) : (
                      // Fallback for initial messages or messages without parts
                      <div className={cn(
                        "leading-relaxed text-[13px]",
                        message.role === "assistant" ? "prose prose-sm dark:prose-invert max-w-none" : ""
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
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <div className="border-t border-border p-4 shrink-0">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Skriv ett meddelande..."
              className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 h-10 w-10" 
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Skicka meddelande</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
