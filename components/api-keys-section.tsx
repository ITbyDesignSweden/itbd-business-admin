"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Trash2, Clock, AlertCircle } from "lucide-react"
import { GenerateApiKeyDialog } from "@/components/generate-api-key-dialog"
import { revokeApiKey, deleteApiKey, type ApiKey } from "@/actions/api-keys"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApiKeysSectionProps {
  orgId: string
  apiKeys: ApiKey[]
}

export function ApiKeysSection({ orgId, apiKeys }: ApiKeysSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleRevoke = async (keyId: string) => {
    const result = await revokeApiKey(keyId, orgId)
    
    if (result.success) {
      toast({
        title: "API-nyckel återkallad",
        description: "Nyckeln är nu inaktiv och kan inte användas längre.",
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte återkalla API-nyckeln",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (keyId: string) => {
    const result = await deleteApiKey(keyId, orgId)
    
    if (result.success) {
      toast({
        title: "API-nyckel raderad",
        description: "Nyckeln har raderats permanent.",
      })
    } else {
      toast({
        title: "Fel",
        description: result.error || "Kunde inte radera API-nyckeln",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Generera och hantera API-nycklar för extern åtkomst
            </CardDescription>
          </div>
          <GenerateApiKeyDialog 
            orgId={orgId} 
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Inga API-nycklar</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Skapa en API-nyckel för att ge extern åtkomst till organisationens data.
            </p>
            <GenerateApiKeyDialog 
              orgId={orgId} 
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              variant="outline"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {apiKey.key_preview}
                    </code>
                    {apiKey.is_active ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="destructive">Återkallad</Badge>
                    )}
                    {apiKey.name && (
                      <span className="text-sm text-muted-foreground">
                        {apiKey.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Skapad {formatDate(apiKey.created_at)}</span>
                    {apiKey.last_used_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Senast använd {formatDate(apiKey.last_used_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {apiKey.is_active ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <AlertCircle className="h-4 w-4" />
                          Återkalla
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Återkalla API-nyckel?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Nyckeln kommer att inaktiveras och kan inte användas längre.
                            Detta går inte att ångra, men du kan generera en ny nyckel.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(apiKey.id)}>
                            Återkalla
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                          Radera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera API-nyckel?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta kommer att radera nyckeln permanent från systemet.
                            Detta går inte att ångra.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(apiKey.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Radera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

