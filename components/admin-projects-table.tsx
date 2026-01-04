"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import Link from "next/link"
import { BlueprintViewer } from "@/components/blueprint-viewer"
import type { Project } from "@/lib/types/database"

interface ProjectWithOrg extends Project {
  organization_name: string
}

interface AdminProjectsTableProps {
  projects: ProjectWithOrg[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case "backlog":
      return <Badge variant="secondary">Backlog</Badge>
    case "active_pilot":
      return <Badge variant="default" className="bg-purple-500">Aktiv Pilot</Badge>
    case "in_progress":
      return <Badge variant="default" className="bg-blue-500">Pågående</Badge>
    case "completed":
      return <Badge variant="default" className="bg-green-500">Klar</Badge>
    case "cancelled":
      return <Badge variant="outline" className="text-muted-foreground">Avbruten</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function AdminProjectsTable({ projects }: AdminProjectsTableProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState<{
    projectTitle: string
    orgName: string
    blueprint: string
  } | null>(null)

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Inga projekt ännu</p>
        <p className="text-sm text-muted-foreground">Projekt visas här när de skapas via onboarding-chatten</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Projekttitel</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead className="text-right">Krediter</TableHead>
              <TableHead className="text-right">Skapad</TableHead>
              <TableHead className="text-center">Blueprint</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{getStatusBadge(project.status)}</TableCell>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>
                  <Link
                    href={`/organizations/${project.org_id}`}
                    className="hover:underline text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    {project.organization_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{project.cost_credits}</span>
                  <span className="ml-1 text-xs text-muted-foreground">kr</span>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(project.created_at), {
                    addSuffix: true,
                    locale: sv,
                  })}
                </TableCell>
                <TableCell className="text-center">
                  {project.ai_blueprint ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBlueprint({
                        projectTitle: project.title,
                        orgName: project.organization_name,
                        blueprint: project.ai_blueprint!,
                      })}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Visa Spec
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ingen spec</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Blueprint Viewer Sheet */}
      {selectedBlueprint && (
        <BlueprintViewer
          projectTitle={selectedBlueprint.projectTitle}
          orgName={selectedBlueprint.orgName}
          blueprint={selectedBlueprint.blueprint}
          open={!!selectedBlueprint}
          onOpenChange={(open) => {
            if (!open) setSelectedBlueprint(null)
          }}
        />
      )}
    </>
  )
}
