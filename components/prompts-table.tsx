"use client"

import { useState, Fragment } from "react"
import { Search, ChevronDown, ChevronRight, Clock, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditPromptDialog } from "@/components/edit-prompt-dialog"
import { TogglePromptButton } from "@/components/toggle-prompt-button"
import { PROMPT_TYPES } from "@/lib/ai/prompt-service"
import { type AIPrompt } from "@/lib/types/database"

const CATEGORY_LABELS: Record<string, string> = {
  [PROMPT_TYPES.CUSTOMER_CHAT]: 'Kundchatt (AI Architect)',
  [PROMPT_TYPES.LEAD_ANALYSIS_SYSTEM]: 'Lead Analys (System)',
  [PROMPT_TYPES.LEAD_ANALYSIS_USER]: 'Lead Analys (User)',
  [PROMPT_TYPES.INTERNAL_SPEC]: 'Teknisk Specifikation',
  [PROMPT_TYPES.ORG_ENRICHMENT_SYSTEM]: 'Företagsanalys (System)',
  [PROMPT_TYPES.ORG_ENRICHMENT_USER]: 'Företagsanalys (User)',
}

interface PromptsTableProps {
  prompts: AIPrompt[]
}

export function PromptsTable({ prompts }: PromptsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (CATEGORY_LABELS[prompt.prompt_type as keyof typeof CATEGORY_LABELS] || prompt.prompt_type).toLowerCase().includes(searchQuery.toLowerCase())
  )

  function toggleRowExpansion(promptId: string) {
    if (expandedRow === promptId) {
      setExpandedRow(null)
    } else {
      setExpandedRow(promptId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alla System Prompts</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök efter namn eller kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Namn</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Senast uppdaterad</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrompts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Inga promptar hittades
                </TableCell>
              </TableRow>
            ) : (
              filteredPrompts.map((prompt) => {
                const isExpanded = expandedRow === prompt.id
                
                return (
                  <Fragment key={prompt.id}>
                    <TableRow 
                      className={`cursor-pointer hover:bg-muted/50 ${prompt.is_active ? 'bg-green-500/5' : ''}`} 
                      onClick={() => toggleRowExpansion(prompt.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {prompt.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[prompt.prompt_type as keyof typeof CATEGORY_LABELS] || prompt.prompt_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {prompt.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        <div className="flex items-center gap-1 text-xs">
                          <History className="h-3 w-3" />
                          {new Date(prompt.updated_at || prompt.created_at).toLocaleDateString("sv-SE")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <TogglePromptButton 
                            promptId={prompt.id} 
                            isActive={prompt.is_active}
                            promptName={prompt.name}
                            promptType={prompt.prompt_type}
                          />
                          <EditPromptDialog prompt={prompt} />
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${prompt.id}-content`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Prompt Innehåll:
                              </p>
                              <div className="text-xs text-muted-foreground">
                                ID: {prompt.id}
                              </div>
                            </div>
                            <div className="rounded-md bg-background border p-4 shadow-inner">
                              <pre className="text-sm whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto leading-relaxed">
                                {prompt.content}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}


