import { GlobalLedgerTable } from "@/components/global-ledger-table"
import { getAllTransactions } from "@/actions/database"

export default async function LedgerPage() {
  const transactions = await getAllTransactions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global huvudbok</h1>
        <p className="text-muted-foreground">
          En komplett översikt över alla transaktioner i systemet. Revisorns favoritvy.
        </p>
      </div>
      <GlobalLedgerTable transactions={transactions} />
    </div>
  )
}

