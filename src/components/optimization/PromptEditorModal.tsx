/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizationPrompts, OptimizationPrompt } from '@/hooks/useOptimizationPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'meta' | 'google';
  objective: string;
}

export const PromptEditorModal = ({
  isOpen,
  onClose,
  platform,
  objective,
}: PromptEditorModalProps) => {
  const { getAllPromptsForObjective, updatePrompt } = useOptimizationPrompts();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const [prompts, setPrompts] = useState<{
    transcribe?: OptimizationPrompt;
    process?: OptimizationPrompt;
    analyze?: OptimizationPrompt;
  }>({});

  const [editedPrompts, setEditedPrompts] = useState<{
    transcribe: string;
    process: string;
    analyze: string;
  }>({
    transcribe: '',
    process: '',
    analyze: '',
  });

  const [isSaving, setIsSaving] = useState(false);

   
  useEffect(() => {
    if (isOpen) {
      // Fetch all 3 prompts for this objective
      const allPrompts = getAllPromptsForObjective(platform, objective);
      setPrompts(allPrompts);
      setEditedPrompts({
        transcribe: allPrompts.transcribe?.prompt_text || '',
        process: allPrompts.process?.prompt_text || '',
        analyze: allPrompts.analyze?.prompt_text || '',
      });
    }
  }, [isOpen, platform, objective]);

  const handleSave = async () => {
    if (!user?.email) return;

    setIsSaving(true);
    try {
      const updates: Promise<boolean>[] = [];

      // Update transcribe prompt if changed
      if (prompts.transcribe && editedPrompts.transcribe !== prompts.transcribe.prompt_text) {
        updates.push(updatePrompt(prompts.transcribe.id, editedPrompts.transcribe, user.email));
      }

      // Update process prompt if changed
      if (prompts.process && editedPrompts.process !== prompts.process.prompt_text) {
        updates.push(updatePrompt(prompts.process.id, editedPrompts.process, user.email));
      }

      // Update analyze prompt if changed
      if (prompts.analyze && editedPrompts.analyze !== prompts.analyze.prompt_text) {
        updates.push(updatePrompt(prompts.analyze.id, editedPrompts.analyze, user.email));
      }

      if (updates.length === 0) {
        toast.info('Nenhuma alteração para salvar');
        onClose();
        return;
      }

      const results = await Promise.all(updates);

      if (results.every(r => r)) {
        toast.success(`${results.length} prompt(s) atualizado(s) com sucesso`);
        onClose();
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      toast.error('Erro ao salvar prompts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore original values
    setEditedPrompts({
      transcribe: prompts.transcribe?.prompt_text || '',
      process: prompts.process?.prompt_text || '',
      analyze: prompts.analyze?.prompt_text || '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdmin ? '✏️ Editar Prompts (Admin)' : '📋 Prompts de Otimização'}
          </DialogTitle>
          <DialogDescription>
            {platform === 'meta' ? 'Meta Ads' : 'Google Ads'} • <strong>{objective}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="transcribe" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcribe">
              📝 Transcrição
            </TabsTrigger>
            <TabsTrigger value="process">
              📊 Processamento
            </TabsTrigger>
            <TabsTrigger value="analyze">
              💡 Análise
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Transcribe */}
          <TabsContent value="transcribe" className="space-y-4">
            <Textarea
              value={editedPrompts.transcribe}
              onChange={(e) => setEditedPrompts({ ...editedPrompts, transcribe: e.target.value })}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Nenhum prompt configurado para este objetivo"
              disabled={!isAdmin}
            />

            {!prompts.transcribe && (
              <Alert variant="destructive">
                <AlertDescription>
                  ⚠️ Nenhum prompt de transcrição encontrado para <strong>{objective}</strong> na plataforma <strong>{platform}</strong>.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab 2: Process */}
          <TabsContent value="process" className="space-y-4">
            <Textarea
              value={editedPrompts.process}
              onChange={(e) => setEditedPrompts({ ...editedPrompts, process: e.target.value })}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Nenhum prompt configurado para este objetivo"
              disabled={!isAdmin}
            />

            {!prompts.process && (
              <Alert variant="destructive">
                <AlertDescription>
                  ⚠️ Nenhum prompt de processamento encontrado para <strong>{objective}</strong> na plataforma <strong>{platform}</strong>.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab 3: Analyze */}
          <TabsContent value="analyze" className="space-y-4">
            <Textarea
              value={editedPrompts.analyze}
              onChange={(e) => setEditedPrompts({ ...editedPrompts, analyze: e.target.value })}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Nenhum prompt configurado para este objetivo"
              disabled={!isAdmin}
            />

            {!prompts.analyze && (
              <Alert variant="destructive">
                <AlertDescription>
                  ⚠️ Nenhum prompt de análise encontrado para <strong>{objective}</strong> na plataforma <strong>{platform}</strong>.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {isAdmin ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
