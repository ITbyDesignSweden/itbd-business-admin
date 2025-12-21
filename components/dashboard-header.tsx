"use client"

import { useState } from "react"
import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MobileSidebar } from "@/components/mobile-sidebar"

interface DashboardHeaderProps {
  userEmail?: string
  userName?: string
}

export function DashboardHeader({ userEmail, userName }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)

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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar onClose={() => setOpen(false)} userEmail={userEmail} userName={userName} />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Avatar className="h-8 w-8 lg:hidden">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
