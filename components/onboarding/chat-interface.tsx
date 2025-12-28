"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Sparkles } from "lucide-react"
// TODO: Import useChat from 'ai/react' when implementing real chat
// import { useChat } from 'ai/react'

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  initialMessage?: string
}

export function ChatInterface({ initialMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hej! 👋 Jag är din personliga assistent och finns här för att hjälpa er komma igång. Berätta gärna lite om era behov så hittar vi rätt lösning tillsammans.",
    },
  ])

  // TODO: Replace with real useChat when implementing
  // const { messages, input, handleInputChange, handleSubmit } = useChat({
  //   api: '/api/chat',
  //   initialMessages: [...]
  // })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Mock implementation - add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Mock assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Tack för ditt meddelande! Detta är en mock-respons. AI-integration kommer i nästa steg.",
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 500)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI-Assistent</h2>
      <Card className="flex flex-col h-[420px]">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">ITBD AI</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Redo att hjälpa
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-5 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    msg.role === "assistant"
                      ? "bg-secondary rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Skriv ett meddelande..."
              className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
              <span className="sr-only">Skicka meddelande</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

