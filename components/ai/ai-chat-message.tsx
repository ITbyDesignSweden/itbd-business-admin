"use client"

import { Bot, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { ProposalCard, ProposalData } from "@/components/onboarding/proposal-card"

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
  token?: string // For onboarding flow (needed for ProposalCard)
  onProposalAccepted?: (text: string) => void // Callback when a proposal is started
}

export function AIChatMessage({
  message,
  assistantIcon = <Bot className="h-4 w-4" />,
  assistantName = "AI",
  token,
  onProposalAccepted
}: ChatMessageProps) {
  const isAssistant = message.role === "assistant"

  // Filter out redundant text parts (prefix deduplication)
  // This handles cases where the model repeats itself in subsequent steps of a tool loop
  const getDisplayParts = () => {
    if (!message.parts) return []

    return message.parts.filter((part: any, index: number) => {
      if (part.type !== 'text') return true

      // Check if there's a later text part that starts with exactly the same text
      const isPrefixOfLaterPart = message.parts?.some((laterPart: any, laterIndex: number) =>
        laterIndex > index &&
        laterPart.type === 'text' &&
        laterPart.text.trim().startsWith(part.text.trim())
      )

      return !isPrefixOfLaterPart
    })
  }

  const displayParts = getDisplayParts()

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
              <>
                {/* Render all parts in order to maintain context flow */}
                {displayParts.map((part: any, index: number) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={`text-${index}`}
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
                    )
                  }

                  const isToolCall = part.type === "tool-invocation" || part.type.startsWith("tool-");

                  if (isToolCall) {
                    const toolInvocation = part.type === "tool-invocation" ? part.toolInvocation : part;
                    const { toolCallId, state } = toolInvocation;
                    const toolName = toolInvocation.toolName || part.type.replace("tool-", "");

                    // Kontrollera om vi har ett faktiskt resultat att visa
                    const result = toolInvocation.output || toolInvocation.result;

                    // Om vi inte har ett resultat än, visa laddnings-spinnern för verktyget
                    if (!result && state !== 'output-error') {
                      const loadingMessages: Record<string, string> = {
                        'submit_feature_request': 'Skapar teknisk specifikation...',
                        'manage_feature_idea': 'Hanterar idélista...',
                        'generate_pilot_proposal': 'Skapar förslag...',
                      }

                      return (
                        <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground italic my-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {loadingMessages[toolName] || `Kör ${toolName}...`}
                        </div>
                      );
                    }

                    if (state === 'output-error') {
                      return (
                        <div key={toolCallId} className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-700 dark:text-red-400 my-2">
                          ❌ {toolInvocation.errorText || 'Ett oväntat fel uppstod'}
                        </div>
                      );
                    }

                    // Om vi har ett resultat, rendera det
                    if (result) {
                      // Handle submit_feature_request (existing)
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

                      // Handle manage_feature_idea (Sprint 10.2)
                      if (toolName === 'manage_feature_idea') {
                        if (result.success) {
                          return (
                            <div key={toolCallId} className="flex items-center gap-1.5 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {result.message}
                            </div>
                          );
                        }
                      }

                      // Handle generate_pilot_proposal (Sprint 10.3)
                      if (toolName === 'generate_pilot_proposal') {
                        if (result.success && result.proposal) {
                          // Render the proposal card instead of text
                          if (!token) {
                            console.warn('Token missing - cannot render ProposalCard')
                            return null
                          }

                          return (
                            <div key={toolCallId} className="my-3">
                              <ProposalCard
                                proposal={result.proposal as ProposalData}
                                token={token}
                                onAccepted={() => onProposalAccepted?.('Jag har nu klickat på "Starta Pilotprojekt". Bekräfta att vi är igång och att ni påbörjar arbetet nu, samt att du finns här om jag har fler funderingar.')}
                              />
                            </div>
                          );
                        }
                      }
                    }
                  }

                  return null;
                })}
              </>
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
