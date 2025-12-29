"use client"

import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles } from "lucide-react"
import { AIChatInterface } from "@/components/ai/ai-chat-interface"

interface SDRChatProps {
  chat: any
  orgId: string
}

export function SDRChat({ chat, orgId }: SDRChatProps) {
  const { messages, status, error } = chat
  
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI-Assistent</h2>
      <Card className="flex flex-col h-[420px] overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 px-5 py-4 shrink-0 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground text-sm">ITBD SDR</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Redo att hjälpa
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <AIChatInterface
          messages={messages}
          status={status}
          sendMessage={(options, config) => {
            chat.sendMessage(options, {
              ...config,
              body: {
                orgId,  // Säkerställ att orgId alltid finns
                ...config?.body,  // Merga med eventuella andra body-parametrar (som attachments)
              },
            })
          }}
         // extraBody={{ orgId }}
          storagePathIdentifier={orgId}
          placeholder="Skriv ett meddelande..."
          assistantIcon={<Sparkles className="h-4 w-4 text-primary" />}
          assistantName="ITBD SDR"
          showWelcome={false}
          allowAttachments={true}
          error={error}
          className="flex-1 min-h-0"
        />
      </Card>
    </div>
  )
}
