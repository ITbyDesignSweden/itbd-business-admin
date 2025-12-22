import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Project } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"

interface ProjectsTableProps {
  projects: Project[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case "backlog":
      return <Badge variant="secondary">Backlog</Badge>
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

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">Inga projekt ännu</p>
        <p className="text-sm text-muted-foreground">Skapa ditt första projekt för att komma igång</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projekttitel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Kostnad</TableHead>
            <TableHead className="text-right">Skapad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell>{getStatusBadge(project.status)}</TableCell>
              <TableCell className="text-right">
                <span className="font-mono">{project.cost_credits}</span>
                <span className="ml-1 text-xs text-muted-foreground">pts</span>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(project.created_at), {
                  addSuffix: true,
                  locale: sv,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
