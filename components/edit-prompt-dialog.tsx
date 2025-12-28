'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updatePrompt, deletePrompt } from '@/actions/ai-prompts';
import { Pencil, Trash2 } from 'lucide-react';
import { type AIPrompt } from '@/lib/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROMPT_TYPES } from '@/lib/ai/prompt-service';
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
} from '@/components/ui/alert-dialog';

interface EditPromptDialogProps {
  prompt: AIPrompt;
}

export function EditPromptDialog({ prompt }: EditPromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const prompt_type = formData.get('prompt_type') as string;
    const isActive = formData.get('is_active') === 'on';

    try {
      await updatePrompt(prompt.id, { name, content, prompt_type, is_active: isActive });
      
      toast({
        title: 'Prompt uppdaterad',
        description: `${name} har sparats.`,
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte uppdatera prompt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deletePrompt(prompt.id);
      toast({
        title: 'Prompt borttagen',
        description: `${prompt.name} har tagits bort.`,
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte ta bort prompt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Redigera
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redigera Prompt</DialogTitle>
            <DialogDescription>
              Uppdatera system prompt för AI Architect
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                name="name"
                defaultValue={prompt.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt_type">Typ</Label>
              <Select name="prompt_type" defaultValue={prompt.prompt_type || PROMPT_TYPES.CUSTOMER_CHAT}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROMPT_TYPES.CUSTOMER_CHAT}>Kundchatt (AI Architect)</SelectItem>
                  <SelectItem value={PROMPT_TYPES.LEAD_ANALYSIS_SYSTEM}>Lead Analys (System)</SelectItem>
                  <SelectItem value={PROMPT_TYPES.LEAD_ANALYSIS_USER}>Lead Analys (User)</SelectItem>
                  <SelectItem value={PROMPT_TYPES.INTERNAL_SPEC}>Teknisk Specifikation</SelectItem>
                  <SelectItem value={PROMPT_TYPES.ORG_ENRICHMENT_SYSTEM}>Företagsanalys (System)</SelectItem>
                  <SelectItem value={PROMPT_TYPES.ORG_ENRICHMENT_USER}>Företagsanalys (User)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={prompt.content}
                className="min-h-[400px] font-mono text-sm"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                defaultChecked={prompt.is_active}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                Aktivera denna prompt (inaktiverar andra)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ta bort
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta kommer permanent ta bort prompten &quot;{prompt.name}&quot;. 
                    Denna åtgärd kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sparar...' : 'Spara ändringar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

