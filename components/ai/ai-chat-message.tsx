"use client"

import { Bot, Loader2, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

export interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system" | "data"
    content: string
    parts?: any[]
    metadata?: {
      modelId?: string
      usage?: {
        totalTokens: number
      }
    }
  }
  assistantIcon?: React.ReactNode
  assistantName?: string
}

export function AIChatMessage({ 
  message, 
  assistantIcon = <Bot className="h-4 w-4" />,
  assistantName = "AI" 
}: ChatMessageProps) {
  const isAssistant = message.role === "assistant"

  return (
    <div
      className={cn(
        "flex gap-3 text-sm mb-4",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {assistantIcon}
        </div>
      )}
      
      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[80%]">
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 break-words [word-break:break-word] overflow-hidden",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
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
                        isAssistant ? "prose prose-sm dark:prose-invert max-w-none" : ""
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

                  if (state === 'result') {
                    const { result } = toolInvocation;
                    if (toolName === 'submit_feature_request') {
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
                }

                return null;
              })
            ) : (
              <div className={cn(
                "leading-relaxed text-[13px]",
                isAssistant ? "prose prose-sm dark:prose-invert max-w-none" : ""
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

        {isAssistant && message.metadata && (
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
  )
}

