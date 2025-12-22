"use client"

import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { CreditLedger } from "@/lib/types/database"

interface CreditLedgerTableProps {
  transactions: CreditLedger[]
}

export function CreditLedgerTable({ transactions }: CreditLedgerTableProps) {
  // Calculate running balance for each transaction
  const transactionsWithBalance = transactions.map((transaction, index) => {
    // Since transactions are sorted newest first, we need to calculate from the end
    const laterTransactions = transactions.slice(0, index + 1)
    const runningBalance = laterTransactions.reduce((sum, t) => sum + t.amount, 0)
    
    return {
      ...transaction,
      runningBalance,
    }
  })

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Inga transaktioner än</p>
        <p className="text-sm text-muted-foreground mt-1">
          Transaktioner kommer att visas här när krediter läggs till eller används.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Beskrivning</TableHead>
            <TableHead className="text-right">Belopp</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactionsWithBalance.map((transaction) => {
            const isPositive = transaction.amount > 0
            const formattedDate = format(new Date(transaction.created_at), "d MMM yyyy, HH:mm", {
              locale: sv,
            })

            return (
              <TableRow key={transaction.id}>
                <TableCell className="text-muted-foreground text-sm">
                  {formattedDate}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.description}
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
                    {isPositive ? "+" : ""}{transaction.amount} pts
                  </Badge>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell font-medium">
                  {transaction.runningBalance} pts
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

