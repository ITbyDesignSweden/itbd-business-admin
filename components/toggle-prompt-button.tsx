'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { togglePromptActive } from '@/actions/ai-prompts';
import { Power, PowerOff } from 'lucide-react';
import { PROMPT_TYPE_LABELS, type PromptType } from '@/lib/ai/prompt-service';

interface TogglePromptButtonProps {
  promptId: string;
  isActive: boolean;
  promptName: string;
  promptType: string;
}

export function TogglePromptButton({ promptId, isActive, promptName, promptType }: TogglePromptButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleToggle() {
    setLoading(true);
    try {
      await togglePromptActive(promptId, isActive, promptType);

      const typeLabel = PROMPT_TYPE_LABELS[promptType as PromptType] || promptType;

      toast({
        title: isActive ? 'Prompt inaktiverad' : 'Prompt aktiverad',
        description: isActive
          ? `${promptName} är nu inaktiv.`
          : `${promptName} är nu aktiv och används för ${typeLabel}.`,
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte ändra status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {isActive ? (
        <>
          <PowerOff className="mr-2 h-4 w-4" />
          Inaktivera
        </>
      ) : (
        <>
          <Power className="mr-2 h-4 w-4" />
          Aktivera
        </>
      )}
    </Button>
  );
}
