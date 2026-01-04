import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminProjectsTable } from "@/components/admin-projects-table"
import { createClient } from "@/lib/supabase/server"
import type { Project } from "@/lib/types/database"

interface ProjectWithOrg extends Project {
  organization_name: string
}

/**
 * Sprint 11: Mission Control - Global Projects View
 * Shows all projects across all organizations with blueprint access
 */
export default async function AdminProjectsPage() {
  const supabase = await createClient()

  // Fetch all projects with organization names
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      organizations!inner(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  // Transform data to include organization name
  const projectsWithOrg: ProjectWithOrg[] = (projects || []).map((project: any) => ({
    id: project.id,
    created_at: project.created_at,
    org_id: project.org_id,
    title: project.title,
    status: project.status,
    cost_credits: project.cost_credits,
    source_feature_idea_id: project.source_feature_idea_id,
    ai_blueprint: project.ai_blueprint,
    organization_name: project.organizations?.name || 'Unknown',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekt Pipeline</h1>
          <p className="text-muted-foreground">
            Global översikt av alla projekt med tekniska specifikationer
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alla Projekt</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminProjectsTable projects={projectsWithOrg} />
        </CardContent>
      </Card>
    </div>
  )
}
