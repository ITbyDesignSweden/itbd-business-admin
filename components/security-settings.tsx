"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Profile } from "@/lib/types/database"

interface SecuritySettingsProps {
  profile: Profile
}

export function SecuritySettings({ profile }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">E-postadress</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="bg-muted"
        />
        <p className="text-sm text-muted-foreground">
          Din e-postadress kan inte ändras för närvarande.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Behörighet</Label>
        <div className="flex items-center gap-2">
          <Input
            id="role"
            type="text"
            value={profile.role}
            disabled
            className="bg-muted flex-1"
          />
          <Badge variant="secondary" className="capitalize">
            {profile.role}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Din roll bestämmer vilka funktioner du har tillgång till.
        </p>
      </div>

      <div className="rounded-lg border border-muted bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Observera:</strong> Lösenordshantering och tvåfaktorsautentisering 
          kommer i en framtida version.
        </p>
      </div>
    </div>
  )
}











