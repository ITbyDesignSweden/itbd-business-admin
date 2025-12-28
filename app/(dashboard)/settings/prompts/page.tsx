import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditPromptDialog } from '@/components/edit-prompt-dialog';
import { CreatePromptDialog } from '@/components/create-prompt-dialog';
import { TogglePromptButton } from '@/components/toggle-prompt-button';
import { PROMPT_TYPES } from '@/lib/ai/prompt-service';

const CATEGORY_LABELS: Record<string, string> = {
  [PROMPT_TYPES.CUSTOMER_CHAT]: 'Kundchatt (AI Architect)',
  [PROMPT_TYPES.LEAD_ANALYSIS_SYSTEM]: 'Lead Analys (System)',
  [PROMPT_TYPES.LEAD_ANALYSIS_USER]: 'Lead Analys (User)',
  [PROMPT_TYPES.INTERNAL_SPEC]: 'Teknisk Specifikation',
  [PROMPT_TYPES.ORG_ENRICHMENT_SYSTEM]: 'Företagsanalys (System)',
  [PROMPT_TYPES.ORG_ENRICHMENT_USER]: 'Företagsanalys (User)',
};

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

      <div className="grid gap-8">
        {prompts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Inga prompts finns ännu. Skapa en för att komma igång.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(CATEGORY_LABELS).map(([type, label]) => {
            const typePrompts = prompts.filter(p => (p.prompt_type || PROMPT_TYPES.CUSTOMER_CHAT) === type);
            if (typePrompts.length === 0) return null;

            return (
              <div key={type} className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {label}
                  <Badge variant="outline" className="ml-2">
                    {typePrompts.length}
                  </Badge>
                </h2>
                <div className="grid gap-4">
                  {typePrompts.map((prompt) => (
                    <Card key={prompt.id} className={prompt.is_active ? 'border-green-500 bg-green-50/10' : ''}>
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
                              promptType={type}
                            />
                            <EditPromptDialog prompt={prompt} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md bg-muted p-4">
                          <pre className="text-sm whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                            {prompt.content}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-4">
          <div>
            <p className="font-semibold">System Prompt:</p>
            <p>Detta är instruktionerna som styr hur AI:n beter sig för olika funktioner.</p>
          </div>
          <div>
            <p className="font-semibold">En aktiv per typ:</p>
            <p>Det kan finnas en aktiv prompt per kategori (t.ex. en för Lead Analys och en för Teknisk Spec). När du aktiverar en ny inom en kategori inaktiveras den tidigare automatiskt.</p>
          </div>
          <div>
            <p className="font-semibold">Variabler:</p>
            <p>Använd <code>{"{{variable_name}}"}</code> för att injicera dynamisk data. Exempel:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>Lead Analys: <code>{"{{company_name}}"}</code>, <code>{"{{org_nr}}"}</code>, <code>{"{{description}}"}</code></li>
              <li>Teknisk Spec: <code>{"{{projectId}}"}</code>, <code>{"{{featureSummary}}"}</code>, <code>{"{{existingSchema}}"}</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

