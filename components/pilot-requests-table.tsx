"use client"

import { useState, Fragment } from "react"
import { Search, FileText, Download, CheckCircle, XCircle, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updatePilotRequestStatus, getPilotFileUrl } from "@/actions/pilot-requests"
import { analyzeLeadAction } from "@/actions/analyze-lead"
import { useToast } from "@/components/ui/use-toast"
import type { PilotRequestWithAttachments } from "@/lib/types/database"

interface PilotRequestsTableProps {
  requests: PilotRequestWithAttachments[]
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-500"
    case "rejected":
      return "bg-red-500/10 text-red-500"
    case "pending":
    default:
      return "bg-amber-500/10 text-amber-500"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Godkänd"
    case "rejected":
      return "Avvisad"
    case "pending":
    default:
      return "Väntar"
  }
}

function getFitScoreBadge(fitScore: number | null) {
  if (fitScore === null) {
    return (
      <Badge variant="outline" className="bg-slate-500/10 text-slate-500">
        —
      </Badge>
    )
  }

  if (fitScore >= 80) {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        🟢 {fitScore}
      </Badge>
    )
  }

  if (fitScore >= 50) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        🟡 {fitScore}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
      🔴 {fitScore}
    </Badge>
  )
}

export function PilotRequestsTable({ requests }: PilotRequestsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredRequests = requests.filter((req) =>
    req.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleStatusUpdate(id: string, status: "approved" | "rejected") {
    setLoadingId(id)
    const result = await updatePilotRequestStatus({ id, status })
    
    if (result.success) {
      if (status === "approved" && result.organizationId) {
        toast({
          title: "Organisation skapad från förfrågan!",
          description: `${result.data?.company_name} har godkänts och lagts till som ny organisation.`,
        })
      } else if (status === "approved") {
        toast({
          title: "Ansökan godkänd",
          description: `Statusen har uppdaterats för ${result.data?.company_name}.`,
        })
      } else {
        toast({
          title: "Ansökan avvisad",
          description: `Statusen har uppdaterats för ${result.data?.company_name}.`,
        })
      }
      // Refresh page to show updated data
      window.location.reload()
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte uppdatera status.",
        variant: "destructive",
      })
    }
    
    setLoadingId(null)
  }

  async function handleDownloadFile(filePath: string, fileName: string) {
    const result = await getPilotFileUrl(filePath)
    
    if (result.success && result.url) {
      // Open file in new tab
      window.open(result.url, "_blank")
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte hämta fil.",
        variant: "destructive",
      })
    }
  }

  function toggleRowExpansion(requestId: string) {
    if (expandedRow === requestId) {
      setExpandedRow(null)
    } else {
      setExpandedRow(requestId)
    }
  }

  async function handleAnalyzeLead(requestId: string, companyName: string) {
    setAnalyzingId(requestId)
    
    toast({
      title: "Analyserar lead...",
      description: `AI:n söker information om ${companyName}`,
    })

    const result = await analyzeLeadAction(requestId)
    
    if (result.success) {
      toast({
        title: "Analys klar!",
        description: `Fit Score: ${result.data?.fit_score}/100`,
      })
      // Refresh page to show updated data
      window.location.reload()
    } else {
      toast({
        title: "Fel vid analys",
        description: result.error || "Kunde inte analysera leadet.",
        variant: "destructive",
      })
    }
    
    setAnalyzingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilotförfrågningar</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök efter företag, kontaktperson eller e-post..."
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
              <TableHead>Företag</TableHead>
              <TableHead>Kontaktperson</TableHead>
              <TableHead className="hidden md:table-cell">E-post</TableHead>
              <TableHead className="hidden lg:table-cell">Org.nr</TableHead>
              <TableHead>Fit Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fil</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Inga ansökningar hittades
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const requestAttachments = request.attachments
                const isExpanded = expandedRow === request.id
                
                return (
                  <Fragment key={request.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRowExpansion(request.id)}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{request.company_name}</div>
                          {request.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {request.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{request.contact_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {request.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {request.org_nr || "—"}
                      </TableCell>
                      <TableCell>
                        {getFitScoreBadge(request.fit_score)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(request.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {isExpanded ? "Dölj" : "Visa"} ({requestAttachments.length})
                        </Button>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {request.status === "pending" ? (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyzeLead(request.id, request.company_name)}
                              disabled={analyzingId === request.id}
                            >
                              <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                              {analyzingId === request.id ? "Analyserar..." : "Analysera"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(request.id, "approved")}
                              disabled={loadingId === request.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                              Godkänn
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(request.id, "rejected")}
                              disabled={loadingId === request.id}
                            >
                              <XCircle className="h-4 w-4 mr-1 text-red-600" />
                              Avvisa
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString("sv-SE")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${request.id}-details`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="space-y-4">
                            {/* AI Analysis Section */}
                            {request.enrichment_data && (
                              <div className="bg-background border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="h-5 w-5 text-purple-600" />
                                  <p className="text-sm font-semibold">AI-analys</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Omsättning:</p>
                                    <p className="font-medium">{request.enrichment_data.turnover_range || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Anställda:</p>
                                    <p className="font-medium">{request.enrichment_data.employee_count || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Bransch:</p>
                                    <p className="font-medium">{request.enrichment_data.industry_sni || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Fit Score:</p>
                                    <p className="font-medium">{request.enrichment_data.fit_score || request.fit_score}/100</p>
                                  </div>
                                </div>
                                {request.enrichment_data.summary && (
                                  <div className="mt-3">
                                    <p className="text-muted-foreground text-sm">Beskrivning:</p>
                                    <p className="text-sm mt-1">{request.enrichment_data.summary}</p>
                                  </div>
                                )}
                                {request.enrichment_data.reasoning && (
                                  <div className="mt-3 bg-purple-500/5 border-l-2 border-purple-500 pl-3 py-2">
                                    <p className="text-muted-foreground text-sm">Motivering:</p>
                                    <p className="text-sm mt-1 italic">{request.enrichment_data.reasoning}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Files Section */}
                            <div>
                              <p className="text-sm font-medium mb-2">Bifogade filer:</p>
                              {requestAttachments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Inga filer bifogade</p>
                              ) : (
                                <div className="grid gap-2">
                                  {requestAttachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center justify-between bg-background border rounded-md p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                          <p className="text-sm font-medium">{attachment.file_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : "Okänd storlek"}
                                            {attachment.file_type && ` • ${attachment.file_type}`}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadFile(attachment.file_path, attachment.file_name)}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Ladda ner
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
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

