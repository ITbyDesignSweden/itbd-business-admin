"use client"

import { useState } from "react"
import { uploadPilotFile, submitPilotRequest } from "@/actions/pilot-requests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFormStatus } from "react-dom"
import { Upload, CheckCircle2, AlertCircle, Shield } from "lucide-react"
import { Turnstile } from "@marsidev/react-turnstile"

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Skickar ansökan..." : "Skicka ansökan"}
    </Button>
  )
}

export default function ApplyPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setUploading(true)

    try {
      // Verify Turnstile token is present
      if (!turnstileToken) {
        setError("Säkerhetsverifiering krävs. Vänligen slutför CAPTCHA.")
        setUploading(false)
        return
      }

      let uploadedFiles: Array<{ path: string; name: string; type: string; size: number }> = []

      // Upload all selected files in parallel for better performance
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadPilotFile(file))
        const uploadResults = await Promise.all(uploadPromises)

        // Check if any upload failed
        for (let i = 0; i < uploadResults.length; i++) {
          const result = uploadResults[i]
          if (!result.success) {
            setError(result.error || `Kunde inte ladda upp ${selectedFiles[i].name}`)
            setUploading(false)
            return
          }
        }

        // All uploads succeeded, build the uploaded files array
        uploadedFiles = uploadResults.map((result, i) => ({
          path: result.path!,
          name: selectedFiles[i].name,
          type: selectedFiles[i].type,
          size: selectedFiles[i].size,
        }))
      }

      // Submit pilot request with Turnstile verification (Sprint 6)
      const result = await submitPilotRequest({
        email: formData.get("email") as string,
        contact_name: formData.get("contact_name") as string,
        company_name: formData.get("company_name") as string,
        org_nr: formData.get("org_nr") as string || undefined,
        description: formData.get("description") as string || undefined,
        turnstile_token: turnstileToken,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      })

      if (!result.success) {
        console.error("Error creating pilot request:", result.error)
        setError(result.error || "Kunde inte skicka ansökan")
      } else {
        console.log("Success! Created pilot request:", result.data)
        setSuccess(true)
        // Reset Turnstile for next submission
        setTurnstileToken(null)
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod. Försök igen.")
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

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

    const validFiles: File[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} är för stor. Max 10MB per fil.`)
        e.target.value = ""
        return
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name} har ej tillåten filtyp. Endast PDF, Word, Excel och bilder.`)
        e.target.value = ""
        return
      }

      validFiles.push(file)
    }

    setSelectedFiles(validFiles)
    setError(null)
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
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
                setSelectedFiles([])
                setTurnstileToken(null)
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
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel eller bilder. Max 10MB per fil. Du kan välja flera filer.
              </p>
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Valda filer ({selectedFiles.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-1.5"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-xs text-green-700 dark:text-green-300">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                          disabled={uploading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Cloudflare Turnstile - Sprint 6 Security */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Säkerhetsverifiering <span className="text-destructive">*</span>
              </label>
              <div className="flex justify-center p-4 bg-muted/30 rounded-md">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => {
                    setTurnstileToken(token)
                    setError(null)
                  }}
                  onError={() => {
                    setTurnstileToken(null)
                    setError("Säkerhetsverifiering misslyckades. Ladda om sidan och försök igen.")
                  }}
                  onExpire={() => {
                    setTurnstileToken(null)
                  }}
                />
              </div>
              {!turnstileToken && (
                <p className="text-xs text-muted-foreground">
                  Slutför säkerhetsverifieringen för att kunna skicka ansökan.
                </p>
              )}
            </div>

            <SubmitButton disabled={!turnstileToken} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

