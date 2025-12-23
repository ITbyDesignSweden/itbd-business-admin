"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Check, AlertTriangle } from "lucide-react"
import { generateApiKey } from "@/actions/api-keys"
import { useToast } from "@/components/ui/use-toast"

interface GenerateApiKeyDialogProps {
  orgId: string
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  variant?: "default" | "outline"
}

export function GenerateApiKeyDialog({ 
  orgId, 
  isGenerating, 
  setIsGenerating,
  variant = "default" 
}: GenerateApiKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    const result = await generateApiKey(orgId, keyName || undefined)
    
    setIsGenerating(false)

    if (result.success && result.apiKey) {
      setGeneratedKey(result.apiKey)
      setKeyName("")
      toast({
        title: "API-nyckel skapad",
        description: "Kopiera nyckeln nu - den visas bara en gång!",
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte skapa API-nyckel",
        variant: "destructive",
      })
      setOpen(false)
    }
  }

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Kopierad!",
        description: "API-nyckeln har kopierats till urklipp.",
      })
    }
  }

  const handleClose = () => {
    if (generatedKey) {
      const confirmed = window.confirm(
        "Har du kopierat API-nyckeln? Den kan inte visas igen!"
      )
      if (!confirmed) return
    }
    setOpen(false)
    setGeneratedKey(null)
    setKeyName("")
    setCopied(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus className="h-4 w-4" />
          Generera ny nyckel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        {!generatedKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Generera ny API-nyckel</DialogTitle>
              <DialogDescription>
                Skapa en säker API-nyckel för extern åtkomst till organisationens data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">
                  Namn (valfritt)
                </Label>
                <Input
                  id="keyName"
                  placeholder="t.ex. Production API, Development"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ett beskrivande namn hjälper dig att identifiera nyckeln senare.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Genererar..." : "Generera nyckel"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Spara din API-nyckel
              </DialogTitle>
              <DialogDescription>
                Detta är den enda gången nyckeln visas. Kopiera och spara den på ett säkert ställe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <Label htmlFor="generatedKey" className="text-xs font-medium">
                  Din API-nyckel
                </Label>
                <div className="flex items-center gap-2">
                  <code 
                    id="generatedKey"
                    className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border break-all"
                  >
                    {generatedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Viktigt att veta
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li>Nyckeln lagras krypterad och kan inte visas igen</li>
                      <li>Håll nyckeln hemlig - den ger full åtkomst till organisationens data</li>
                      <li>Du kan återkalla nyckeln när som helst</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Jag har sparat nyckeln
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

