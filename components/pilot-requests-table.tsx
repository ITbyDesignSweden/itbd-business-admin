"use client"

import { useState } from "react"
import { Search, FileText, Download, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updatePilotRequestStatus, getPilotFileUrl } from "@/actions/pilot-requests"
import { useToast } from "@/components/ui/use-toast"
import type { PilotRequest } from "@/actions/pilot-requests"

interface PilotRequestsTableProps {
  requests: PilotRequest[]
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

export function PilotRequestsTable({ requests }: PilotRequestsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
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

  async function handleDownloadFile(filePath: string, companyName: string) {
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
              <TableHead>Status</TableHead>
              <TableHead>Fil</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Inga ansökningar hittades
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
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
                    <Badge variant="secondary" className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.file_path ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(request.file_path!, request.company_name)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        <Download className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "pending" ? (
                      <div className="flex justify-end gap-2">
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

