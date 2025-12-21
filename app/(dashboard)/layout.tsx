import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { getUser } from "@/actions/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const supabase = await createClient()

  // Try to get profile data (gracefully handle errors)
  let userName: string | undefined
  if (user) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      if (!error && profile) {
        userName = profile.full_name || undefined
      }
    } catch (error) {
      // Profile query failed - continue without name
      console.warn("Could not fetch profile:", error)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={user?.email} userName={userName} />
      <div className="flex flex-1 flex-col">
        <DashboardHeader userEmail={user?.email} userName={userName} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

