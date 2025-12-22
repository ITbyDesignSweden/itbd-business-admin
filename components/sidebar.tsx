"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Receipt, Inbox, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizations", label: "Organisationer", icon: Users },
  { href: "/ledger", label: "Huvudbok", icon: Receipt },
  { href: "/pilot-requests", label: "Pilotförfrågningar", icon: Inbox },
  { href: "/settings", label: "Inställningar", icon: Settings },
]

interface SidebarProps {
  userEmail?: string
  userName?: string
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname()

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : "AD"

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-xl font-bold text-sidebar-foreground">IT by Design</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {userName || userEmail || "Admin"}
            </span>
            <span className="text-xs text-sidebar-foreground/60">Admin</span>
          </div>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/70"
          >
            <LogOut className="h-4 w-4" />
            Logga ut
          </Button>
        </form>
      </div>
    </aside>
  )
}
