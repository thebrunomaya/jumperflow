/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIProcessImprovementsModal - AI-assisted improvements for Step 2 (organized bullets)
 * Similar to AIImprovementsModal but for processed_text adjustments
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

interface AIProcessImprovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  currentText: string;
  onApply: (improvedText: string) => Promise<void>;
  isAdmin?: boolean;
  onDebug?: () => void;
}

export function AIProcessImprovementsModal({
  isOpen,
  onClose,
  recordingId,
  currentText,
  onApply,
  isAdmin,
  onDebug,
}: AIProcessImprovementsModalProps) {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [instructions, setInstructions] = useState('');
  const [suggestedText, setSuggestedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleGetSuggestions() {
    if (!instructions.trim()) {
      toast.error('Por favor, descreva os ajustes desejados');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'j_hub_optimization_improve_processed',
        {
          body: {
            recording_id: recordingId,
            action: 'ai_improve',
            current_text: currentText,
            user_instructions: instructions,
          },
        }
      );

      if (error) throw error;

      if (data.success && data.improved_text) {
        setSuggestedText(data.improved_text);
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

  async function handleApplyChanges() {
    try {
      await onApply(suggestedText);
      toast.success('Bullets ajustados aplicados!');
      handleClose();
    } catch (error: any) {
      console.error('Apply error:', error);
      toast.error('Erro ao aplicar ajustes: ' + error.message);
    }
  }

  function handleClose() {
    setStep('input');
    setInstructions('');
    setSuggestedText('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ajustar Bullets com IA
          </DialogTitle>
          <DialogDescription>
            {step === 'input' ?
              'Descreva os ajustes que deseja fazer nos bullets organizados. A IA aplicará apenas as mudanças solicitadas.' :
              'Revise as mudanças sugeridas antes de aplicar'}
          </DialogDescription>
          {isAdmin && onDebug && (
            <JumperButton
              size="sm"
              variant="ghost"
              onClick={onDebug}
              className="absolute right-8 top-0 h-8 w-8 p-0 border border-border"
              title="Debug (Admin)"
            >
              <Bug className="h-4 w-4" />
            </JumperButton>
          )}
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="instructions" className="text-base font-semibold mb-2 block">
                📝 Descreva os ajustes desejados
              </Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Exemplos:&#10;• Adicionar emoji 📊 antes de todas as métricas&#10;• Mover o tópico X para antes do tópico Y&#10;• Adicionar uma seção de conclusão no final"
                className="min-h-[150px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Dica: Use bullets para organizar múltiplas mudanças
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                A IA fará <strong>apenas os ajustes solicitados</strong>, preservando o resto do texto.
                Você poderá revisar antes de aplicar.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 block flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Mudanças Sugeridas
              </Label>
              <div className="border rounded-md p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                <DiffView oldText={currentText} newText={suggestedText} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                🔍 Verde = adicionado | Vermelho riscado = removido
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                Se as mudanças estiverem corretas, clique em <strong>"Aplicar Mudanças"</strong>.
                Caso contrário, clique em <strong>"Voltar"</strong> para ajustar as instruções.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === 'input' && (
            <>
              <JumperButton variant="ghost" onClick={handleClose}>
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
                    Ajustar com IA
                  </>
                )}
              </JumperButton>
            </>
          )}

          {step === 'preview' && (
            <>
              <JumperButton
                variant="ghost"
                onClick={() => setStep('input')}
              >
                Voltar
              </JumperButton>
              <JumperButton
                onClick={handleApplyChanges}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aplicar Mudanças
              </JumperButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
