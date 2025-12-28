import { Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Organisation hittades inte</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vi kunde inte hitta den organisation du söker. Kontrollera att länken är korrekt eller kontakta oss för hjälp.
          </p>
        </div>

        <Button asChild>
          <Link href="/">
            Gå till startsidan
          </Link>
        </Button>
      </div>
    </div>
  )
}

