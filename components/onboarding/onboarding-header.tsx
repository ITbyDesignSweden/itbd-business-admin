import { Building2 } from "lucide-react"

interface OnboardingHeaderProps {
  companyName: string
}

export function OnboardingHeader({ companyName }: OnboardingHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ITBD</span>
          </div>

          {/* Company Name */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Inloggad som</span>
            <span className="font-medium text-foreground">{companyName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

