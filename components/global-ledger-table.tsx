"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GlobalLedgerTransaction } from "@/lib/types/database"

interface GlobalLedgerTableProps {
  transactions: GlobalLedgerTransaction[]
}

export function GlobalLedgerTable({ transactions }: GlobalLedgerTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<string>("all")
  const router = useRouter()

  // Get unique organizations for filter dropdown
  const uniqueOrganizations = Array.from(
    new Set(transactions.map((tx) => JSON.stringify({ id: tx.org_id, name: tx.organization_name })))
  )
    .map((str) => JSON.parse(str))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Filter transactions based on search and organization filter
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.project_title && tx.project_title.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesOrgFilter = selectedOrg === "all" || tx.org_id === selectedOrg

    return matchesSearch && matchesOrgFilter
  })

  const handleOrganizationClick = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/organizations/${orgId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Ledger</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sök på kund, projekt eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="pl-9">
                <SelectValue placeholder="Alla kunder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kunder</SelectItem>
                {uniqueOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Inga transaktioner hittades</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || selectedOrg !== "all"
                ? "Prova att justera din sökning eller filter."
                : "Transaktioner kommer att visas här när krediter läggs till eller används."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kund</TableHead>
                  <TableHead className="hidden md:table-cell">Projekt</TableHead>
                  <TableHead>Beskrivning</TableHead>
                  <TableHead className="text-right">Belopp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const isPositive = transaction.amount > 0
                  const formattedDate = format(new Date(transaction.created_at), "d MMM yyyy, HH:mm", {
                    locale: sv,
                  })

                  return (
                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formattedDate}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => handleOrganizationClick(transaction.org_id, e)}
                          className="font-medium hover:text-primary hover:underline transition-colors text-left"
                        >
                          {transaction.organization_name}
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.project_id && transaction.project_title ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/organizations/${transaction.org_id}`)
                            }}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {transaction.project_title}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{transaction.description}</span>
                          {transaction.project_title && (
                            <span className="text-xs text-muted-foreground md:hidden">
                              Projekt: {transaction.project_title}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono"
                              : "bg-red-500/10 text-red-600 border-red-500/20 font-mono"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {transaction.amount} pts
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

