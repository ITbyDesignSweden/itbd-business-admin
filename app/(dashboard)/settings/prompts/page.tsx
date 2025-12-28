import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePromptDialog } from '@/components/create-prompt-dialog';
import { PromptsTable } from '@/components/prompts-table';

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

      <PromptsTable prompts={prompts} />

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

