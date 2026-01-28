/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UnifiedOptimizationEditorModal - Modal unificado para editar análise em Markdown
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, FileEdit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OptimizationContext } from "@/types/optimization";
import { generateAnalysisMarkdown } from "@/utils/markdownExport";
import { parseMarkdownToContext } from "@/utils/markdownParser";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnifiedOptimizationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: OptimizationContext;
  recordingId: string;
  onSaveSuccess: () => void;
}

const AI_MODELS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Recomendado)" },
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (Padrão)" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4 (Mais Inteligente)" },
] as const;

export function UnifiedOptimizationEditorModal({
  isOpen,
  onClose,
  context,
  recordingId,
  onSaveSuccess,
}: UnifiedOptimizationEditorModalProps) {
  const [markdownContent, setMarkdownContent] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-5-20250929");
  const [aiInstruction, setAiInstruction] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Convert context to Markdown when modal opens
  useEffect(() => {
    if (isOpen) {
      const markdown = generateAnalysisMarkdown(
        context,
        context.account_name || 'Conta desconhecida',
        context.recorded_by,
        context.recorded_at
      );
      setMarkdownContent(markdown);
      setAiError(null);
      setActiveTab("edit");
    }
  }, [isOpen, context]);

  // Função para aplicar IA
  const handleApplyAI = async () => {
    setIsApplyingAI(true);
    setAiError(null);

    try {
      const { data, error } = await supabase.functions.invoke("j_hub_optimization_analyze", {
        body: {
          recording_id: recordingId, // Use snake_case to match edge function
          model: selectedModel,
          correction_prompt: aiInstruction || undefined,
        },
      });

      if (error) throw error;

      if (data?.context) {
        // Convert new analysis to Markdown and replace content
        const newMarkdown = generateAnalysisMarkdown(
          data.context,
          context.account_name || 'Conta desconhecida',
          context.recorded_by,
          context.recorded_at
        );
        setMarkdownContent(newMarkdown);
        toast.success("Análise regenerada com sucesso!");
        setActiveTab("preview");
      }
    } catch (error) {
      console.error("Error regenerating analysis:", error);
      setAiError(error instanceof Error ? error.message : "Erro ao regenerar análise");
      toast.error("Erro ao regenerar análise");
    } finally {
      setIsApplyingAI(false);
    }
  };

  // Função para salvar edições
  const handleSave = async () => {
    setIsSaving(true);

    // Toast de início para feedback imediato
    const savingToast = toast.loading("Salvando revisão...");

    try {
      // 🔍 LOG 0: Verificar se temos o context.id
      console.log("🔍 [SAVE] Context completo:", {
        hasContext: !!context,
        contextId: context?.id,
        accountId: context?.account_id,
        recordingId: recordingId,
        fullContext: context,
      });

      if (!context?.id) {
        console.error("❌ [SAVE] Context ID está faltando!");
        throw new Error("ID do contexto não encontrado. Não é possível salvar.");
      }

      const userEmail = (await supabase.auth.getUser()).data.user?.email;

      // 🔍 LOG 1: Informações antes do save
      console.log("🔍 [SAVE] Iniciando salvamento da revisão:", {
        contextId: context.id,
        recordingId: recordingId,
        userEmail,
        currentConfidenceLevel: context.confidence_level,
        hasRevisedAt: !!(context as any).revised_at,
      });

      // Parse Markdown back to OptimizationContext
      const parsedContext = parseMarkdownToContext(markdownContent);

      // Dados que serão atualizados
      const updatePayload = {
        summary: parsedContext.summary || context.summary,
        actions_taken: JSON.parse(JSON.stringify(parsedContext.actions_taken || context.actions_taken)),
        metrics_mentioned: JSON.parse(JSON.stringify(parsedContext.metrics_mentioned || context.metrics_mentioned)),
        strategy: JSON.parse(JSON.stringify(parsedContext.strategy || context.strategy)),
        timeline: JSON.parse(JSON.stringify(parsedContext.timeline || context.timeline)),
        confidence_level: "revised",
        revised_at: new Date().toISOString(),
      };

      // 🔍 LOG 2: Payload do update
      console.log("🔍 [SAVE] Payload do update:", {
        contextId: context.id,
        confidence_level: updatePayload.confidence_level,
        revised_at: updatePayload.revised_at,
      });

      // Chamar Edge Function para salvar com privilégios e validação
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'j_hub_optimization_update_context',
        {
          body: {
            recording_id: recordingId,
            update: updatePayload,
          },
        }
      );

      console.log('🔍 [SAVE] Resposta da Edge Function:', { fnData, fnError });

      if (fnError || !fnData?.success) {
        console.error('❌ [SAVE] Falha na Edge Function:', fnError || fnData);
        
        // Tratamento específico para FunctionsFetchError
        if (fnError?.name === 'FunctionsFetchError' || fnError?.message?.includes('Failed to send a request')) {
          throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns segundos.');
        }
        
        throw new Error(fnError?.message || fnData?.error || 'Falha ao salvar');
      }

      const verifyData = fnData.updated;

      // Verificar se os dados foram realmente salvos
      if (verifyData.confidence_level !== 'revised' || !verifyData.revised_at) {
        console.error('❌ [SAVE] Dados não foram salvos corretamente:', verifyData);
        throw new Error('Os dados foram salvos mas não refletem as mudanças esperadas');
      }

      console.log('✅ [SAVE] Salvamento confirmado com sucesso!');

      // Atualizar toast para sucesso
      toast.success('Análise revisada salva com sucesso!', { id: savingToast });

      // Chamar callback de sucesso para forçar refetch
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("❌ [SAVE] Erro geral no save:", err);
      toast.error(err.message || "Erro ao salvar análise", { id: savingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Extrato de Otimização</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markdown">Conteúdo do Extrato (Markdown)</Label>
              <Textarea
                id="markdown"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="# Extrato de Otimização..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown para formatar: <code>##</code> para títulos, <code>-</code> para listas, <code>**texto**</code> para negrito
              </p>
            </div>

            <Accordion type="single" collapsible className="border rounded-lg">
              <AccordionItem value="ai-regeneration" className="border-none">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="text-sm font-semibold">🤖 Regenerar Análise Completa com IA (opcional)</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {aiError && (
                    <Alert variant="destructive">
                      <AlertDescription>{aiError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo de IA</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instruction">Instruções de Correção (Opcional)</Label>
                    <Textarea
                      id="instruction"
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      placeholder="Ex: Foque mais em métricas de conversão, ajuste o tom para ser mais direto..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button
                    onClick={handleApplyAI}
                    disabled={isApplyingAI}
                    variant="outline"
                    className="w-full"
                  >
                    {isApplyingAI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      "Regenerar Análise Completa"
                    )}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <div className="prose prose-sm max-w-none p-4 border rounded-lg bg-muted/30">
              <div dangerouslySetInnerHTML={{ 
                __html: markdownContent
                  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/^- (.+)$/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                  .replace(/<\/ul>\n<ul>/g, '')
                  .replace(/\n/g, '<br />')
              }} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving || isApplyingAI}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isApplyingAI}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Revisão"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
