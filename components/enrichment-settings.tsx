"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Sparkles, Info } from "lucide-react"
import type { SystemSettings } from "@/lib/types/database"
import { updateSystemSettings } from "@/actions/system-settings"

interface EnrichmentSettingsProps {
  settings: SystemSettings
}

export function EnrichmentSettings({ settings }: EnrichmentSettingsProps) {
  const [enrichmentMode, setEnrichmentMode] = useState(settings.enrichment_mode)
  const [maxDailyLeads, setMaxDailyLeads] = useState(settings.max_daily_leads.toString())
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setIsSaving(true)

    const result = await updateSystemSettings({
      enrichment_mode: enrichmentMode,
      max_daily_leads: parseInt(maxDailyLeads, 10)
    })

    if (result.success) {
      toast({
        title: "Inställningar sparade",
        description: "AI-enrichment-inställningarna har uppdaterats.",
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte spara inställningar.",
        variant: "destructive",
      })
    }

    setIsSaving(false)
  }

  const hasChanges = 
    enrichmentMode !== settings.enrichment_mode || 
    parseInt(maxDailyLeads, 10) !== settings.max_daily_leads

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>AI Lead Enrichment</CardTitle>
        </div>
        <CardDescription>
          Konfigurera hur AI:n automatiskt analyserar och kvalificerar inkommande leads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enrichment Mode */}
        <div className="space-y-2">
          <Label htmlFor="enrichment-mode">Enrichment-läge</Label>
          <Select value={enrichmentMode} onValueChange={(value: any) => setEnrichmentMode(value)}>
            <SelectTrigger id="enrichment-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Manual</span>
                  <span className="text-xs text-muted-foreground">
                    Ingen automatisk analys. Admin klickar "Analysera" manuellt.
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="assist">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Assist</span>
                  <span className="text-xs text-muted-foreground">
                    AI analyserar automatiskt, admin godkänner manuellt.
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="autopilot">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Autopilot</span>
                  <span className="text-xs text-muted-foreground">
                    AI analyserar och godkänner automatiskt (hög risk).
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Mode explanation */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-sm">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {enrichmentMode === "manual" && (
                <p className="text-muted-foreground">
                  Leads analyseras endast när du klickar på "Analysera"-knappen i Pilot Requests-tabellen.
                </p>
              )}
              {enrichmentMode === "assist" && (
                <p className="text-muted-foreground">
                  AI:n analyserar automatiskt varje nytt lead i bakgrunden (tar ~3-5 sekunder). 
                  Du ser Fit Score direkt och kan sedan godkänna/avvisa manuellt.
                </p>
              )}
              {enrichmentMode === "autopilot" && (
                <div>
                  <p className="text-amber-600 font-medium">⚠️ Experimentell funktion</p>
                  <p className="text-muted-foreground">
                    AI:n analyserar OCH godkänner leads automatiskt om Fit Score {">"} 80. 
                    Leads med lägre poäng väntar på manuell granskning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Max Daily Leads */}
        <div className="space-y-2">
          <Label htmlFor="max-daily-leads">Max leads per dag</Label>
          <Input
            id="max-daily-leads"
            type="number"
            min="1"
            max="1000"
            value={maxDailyLeads}
            onChange={(e) => setMaxDailyLeads(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Säkerhetsgräns för att förhindra spam eller oväntade kostnader. 
            När gränsen nås stoppas nya leads automatiskt.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? "Du har osparade ändringar" : "Inga ändringar"}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? "Sparar..." : "Spara ändringar"}
          </Button>
        </div>

        {/* Cost Info */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">💰 Kostnadsinformation</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Varje AI-analys kostar ~500-900 tokens (Gemini Flash)</p>
            <p>• Google Search Grounding tillkommer (liten extra kostnad)</p>
            <p>• Uppskattad kostnad: ~$1-2 per 100 leads</p>
            <p>• Nuvarande modell: <code className="text-xs bg-muted px-1 py-0.5 rounded">gemini-3-flash-preview</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

