"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function TestApiPage() {
  const [apiKey, setApiKey] = useState("itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/v1/credits', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.error || 'Unknown error'}`)
      } else {
        setResponse(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Test</h1>
          <p className="text-muted-foreground">
            Testa /api/v1/credits endpointen
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Endpoint</CardTitle>
            <CardDescription>
              GET /api/v1/credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="itbd_..."
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={testApi} disabled={loading || !apiKey}>
              {loading ? "Testar..." : "Testa API"}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response</CardTitle>
                <Badge variant="default">200 OK</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Credits</p>
                    <p className="text-2xl font-bold">{response.credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-2xl font-bold">{response.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{response.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Status</p>
                    <Badge>{response.subscription_status}</Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Raw JSON:</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Error</CardTitle>
                <Badge variant="destructive">Error</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-destructive/10 text-destructive p-4 rounded-lg overflow-auto text-sm">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>cURL Command</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {`curl.exe -H "Authorization: Bearer ${apiKey}" http://localhost:3000/api/v1/credits`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

