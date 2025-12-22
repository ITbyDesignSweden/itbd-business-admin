"use client"

import { useState } from "react"
import { uploadPilotFile } from "@/actions/pilot-requests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFormStatus } from "react-dom"
import { Upload, CheckCircle2, AlertCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Skickar ansökan..." : "Skicka ansökan"}
    </Button>
  )
}

export default function ApplyPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setUploading(true)

    try {
      let filePath: string | undefined = undefined

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadPilotFile(selectedFile)
        if (!uploadResult.success) {
          setError(uploadResult.error || "Kunde inte ladda upp fil")
          setUploading(false)
          return
        }
        filePath = uploadResult.path
      }

      // Submit pilot request via Edge Function (secure, bypasses RLS)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-pilot-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.get("email") as string,
            contact_name: formData.get("contact_name") as string,
            company_name: formData.get("company_name") as string,
            org_nr: formData.get("org_nr") as string || undefined,
            description: formData.get("description") as string || undefined,
            file_path: filePath || undefined,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        console.error("Error creating pilot request:", result.error)
        setError(result.error || "Kunde inte skicka ansökan")
      } else {
        console.log("Success! Created pilot request:", result.data)
        setSuccess(true)
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod. Försök igen.")
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Filen är för stor. Max 10MB tillåtet.")
        e.target.value = ""
        return
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]

      if (!allowedTypes.includes(file.type)) {
        setError("Filtyp ej tillåten. Endast PDF, Word, Excel och bilder.")
        e.target.value = ""
        return
      }

      setSelectedFile(file)
      setError(null)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Tack för din ansökan!</CardTitle>
            <CardDescription>
              Vi har mottagit din ansökan och återkommer inom kort.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Du kommer att få ett e-postmeddelande när vi har granskat din ansökan.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false)
                setSelectedFile(null)
              }}
            >
              Skicka en ny ansökan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Ansök om Pilot</CardTitle>
          <CardDescription>
            Fyll i formuläret nedan för att ansöka om att bli pilotkund hos IT by Design.
            Vi återkommer inom kort med mer information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="contact_name" className="text-sm font-medium">
                  Kontaktperson <span className="text-destructive">*</span>
                </label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  placeholder="Anna Andersson"
                  required
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-post <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="anna@foretag.se"
                  required
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="company_name" className="text-sm font-medium">
                  Företagsnamn <span className="text-destructive">*</span>
                </label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Företag AB"
                  required
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="org_nr" className="text-sm font-medium">
                  Organisationsnummer
                </label>
                <Input
                  id="org_nr"
                  name="org_nr"
                  type="text"
                  placeholder="556677-8899"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Beskriv era behov
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Berätta om ert företag och vilka IT-behov ni har..."
                rows={4}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Bifoga dokument (valfritt)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel eller bilder. Max 10MB.
              </p>
              {selectedFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

