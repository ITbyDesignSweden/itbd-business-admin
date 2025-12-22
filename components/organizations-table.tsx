"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OrganizationWithCredits } from "@/lib/types/database"

interface OrganizationsTableProps {
  organizations: OrganizationWithCredits[]
}

function getPlanColor(plan: string) {
  switch (plan.toLowerCase()) {
    case "growth":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    case "scale":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
    case "care":
    default:
      return "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-500"
    case "pilot":
      return "bg-amber-500"
    case "churned":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRowClick = (orgId: string) => {
    router.push(`/organizations/${orgId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Organizations</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
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
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Org Number</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell">Credits</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((org) => (
                <TableRow 
                  key={org.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(org.id)}
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {org.org_nr || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getPlanColor(org.subscription_plan)}>
                      {org.subscription_plan.charAt(0).toUpperCase() + org.subscription_plan.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{org.total_credits} pts</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(org.status)}`} />
                      <span className="text-sm capitalize">{org.status}</span>
                    </div>
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
