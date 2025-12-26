import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditPromptDialog } from '@/components/edit-prompt-dialog';
import { CreatePromptDialog } from '@/components/create-prompt-dialog';
import { TogglePromptButton } from '@/components/toggle-prompt-button';

export const dynamic = 'force-dynamic';

async function getPrompts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  return data || [];
}

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Prompts</h1>
          <p className="text-muted-foreground mt-2">
            Hantera system prompts för AI Architect. Den aktiva prompten styr hur AI:n beter sig mot kunderna.
          </p>
        </div>
        <CreatePromptDialog />
      </div>

      <div className="grid gap-4">
        {prompts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Inga prompts finns ännu. Skapa en för att komma igång.
              </p>
            </CardContent>
          </Card>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt.id} className={prompt.is_active ? 'border-green-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {prompt.name}
                      {prompt.is_active && (
                        <Badge variant="default" className="bg-green-600">
                          Aktiv
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Skapad: {new Date(prompt.created_at).toLocaleDateString('sv-SE')}
                      {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                        <> • Uppdaterad: {new Date(prompt.updated_at).toLocaleDateString('sv-SE')}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TogglePromptButton 
                      promptId={prompt.id} 
                      isActive={prompt.is_active}
                      promptName={prompt.name}
                    />
                    <EditPromptDialog prompt={prompt} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {prompt.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>System Prompt:</strong> Detta är "hjärnan" som styr hur AI Architect pratar med kunder.
          </p>
          <p>
            <strong>Endast en aktiv:</strong> Det kan bara finnas en aktiv prompt åt gången. När du aktiverar en ny, inaktiveras automatiskt den gamla.
          </p>
          <p>
            <strong>Testa först:</strong> Testa nya prompts i AI Test innan du aktiverar dem i produktion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

