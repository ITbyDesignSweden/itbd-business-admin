import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Organisation hittades inte</CardTitle>
          <CardDescription>
            Den här organisationen existerar inte eller har tagits bort.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

