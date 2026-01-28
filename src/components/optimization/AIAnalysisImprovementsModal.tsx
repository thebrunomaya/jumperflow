/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIAnalysisImprovementsModal - AI-assisted improvements for Step 3 (analysis/context)
 * Similar to AIProcessImprovementsModal but for optimization context adjustments
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { JumperButton } from "@/components/ui/jumper-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DiffView } from "./DiffView";
import { Loader2, Sparkles, X, CheckCircle, AlertCircle, Bug } from "lucide-react";
import { toast } from "sonner";
import { OptimizationContext } from "@/types/optimization";

interface AIAnalysisImprovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  currentContext: OptimizationContext;
  onApply: (improvedContext: OptimizationContext) => Promise<void>;
  isAdmin?: boolean;
  onDebug?: () => void;
}

export function AIAnalysisImprovementsModal({
  isOpen,
  onClose,
  recordingId,
  currentContext,
  onApply,
  isAdmin,
  onDebug,
}: AIAnalysisImprovementsModalProps) {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [instructions, setInstructions] = useState('');
  const [suggestedContext, setSuggestedContext] = useState<OptimizationContext | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Convert context to readable text for display
  const currentContextText = JSON.stringify({
    summary: currentContext.summary,
    actions_taken: currentContext.actions_taken,
    metrics_mentioned: currentContext.metrics_mentioned,
    strategy: currentContext.strategy,
  }, null, 2);

  const suggestedContextText = suggestedContext ? JSON.stringify({
    summary: suggestedContext.summary,
    actions_taken: suggestedContext.actions_taken,
    metrics_mentioned: suggestedContext.metrics_mentioned,
    strategy: suggestedContext.strategy,
  }, null, 2) : '';

  async function handleGetSuggestions() {
    if (!instructions.trim()) {
      toast.error('Por favor, descreva os ajustes desejados');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'j_hub_optimization_analyze',
        {
          body: {
            recording_id: recordingId,
            action: 'ai_improve',
            user_instructions: instructions,
            force_regenerate: true,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        // Fetch the updated context
        const { data: contextData, error: contextError } = await supabase
          .from('j_hub_optimization_context')
          .select('*')
          .eq('recording_id', recordingId)
          .single();

        if (contextError) throw contextError;

        setSuggestedContext({
          ...currentContext,
          summary: contextData.summary,
          actions_taken: contextData.actions_taken,
          metrics_mentioned: contextData.metrics_mentioned,
          strategy: contextData.strategy,
          timeline: contextData.timeline,
          confidence_level: 'revised',
        });
        setStep('preview');
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (error: any) {
      console.error('AI improvement error:', error);
      toast.error('Erro ao processar ajustes com IA: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApply() {
    if (!suggestedContext) return;

    setIsProcessing(true);
    try {
      await onApply(suggestedContext);
      toast.success('Ajustes aplicados com sucesso');
      handleCloseAndReset();
    } catch (error: any) {
      console.error('Apply error:', error);
      toast.error('Erro ao aplicar ajustes: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleBack() {
    setStep('input');
    setSuggestedContext(null);
  }

  function handleCloseAndReset() {
    setStep('input');
    setInstructions('');
    setSuggestedContext(null);
    setIsProcessing(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseAndReset}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Ajustar Análise com IA
              </DialogTitle>
              <DialogDescription>
                {step === 'input'
                  ? 'Descreva os ajustes que deseja fazer na análise'
                  : 'Revise as alterações sugeridas pela IA'}
              </DialogDescription>
            </div>
            {isAdmin && onDebug && (
              <JumperButton
                size="sm"
                variant="ghost"
                onClick={onDebug}
                className="h-8 w-8 p-0"
              >
                <Bug className="h-4 w-4" />
              </JumperButton>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {step === 'input' ? (
            <>
              {/* Current Context Display */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Análise Atual:</Label>
                <div className="bg-muted/30 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {currentContextText}
                  </pre>
                </div>
              </div>

              {/* Instructions Input */}
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Descreva os Ajustes Desejados:
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Ex: 'Deixe o resumo mais conciso, focando nos principais resultados' ou 'Adicione mais detalhes sobre as métricas mencionadas'"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Seja específico sobre o que deseja ajustar: resumo, ações, métricas, estratégia, etc.
                </p>
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  A IA vai revisar a análise com base nas suas instruções e na transcrição original.
                  Você poderá revisar as alterações antes de aplicar.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* Preview with Diff */}
              <Alert className="border-purple-500/20 bg-purple-500/10">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-xs text-purple-600 dark:text-purple-400">
                  Revise as alterações sugeridas abaixo. Você pode voltar e ajustar as instruções se necessário.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Comparação:</Label>
                <DiffView
                  oldText={currentContextText}
                  newText={suggestedContextText}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          {step === 'input' ? (
            <>
              <JumperButton
                variant="ghost"
                onClick={handleCloseAndReset}
                disabled={isProcessing}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </JumperButton>
              <JumperButton
                onClick={handleGetSuggestions}
                disabled={isProcessing || !instructions.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Sugestões
                  </>
                )}
              </JumperButton>
            </>
          ) : (
            <>
              <JumperButton
                variant="ghost"
                onClick={handleBack}
                disabled={isProcessing}
              >
                Voltar
              </JumperButton>
              <div className="flex gap-2">
                <JumperButton
                  variant="outline"
                  onClick={handleCloseAndReset}
                  disabled={isProcessing}
                >
                  Cancelar
                </JumperButton>
                <JumperButton
                  onClick={handleApply}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aplicar Alterações
                    </>
                  )}
                </JumperButton>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
