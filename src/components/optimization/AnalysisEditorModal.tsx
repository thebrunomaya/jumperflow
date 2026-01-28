/**
 * AnalysisEditorModal - Modal for editing and regenerating AI analysis
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  onRegenerateSuccess: () => void;
}

const AI_MODELS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Recomendado)" },
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (Padrão)" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4 (Mais Inteligente)" },
] as const;

export function AnalysisEditorModal({
  isOpen,
  onClose,
  recordingId,
  onRegenerateSuccess,
}: AnalysisEditorModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4.1-2025-04-14");
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCorrectionPrompt("");
      setError(null);
    }
  }, [isOpen]);

  const handleRegenerate = async () => {
    if (!selectedModel) {
      toast.error("Por favor, selecione um modelo de IA");
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const { error: functionError } = await supabase.functions.invoke(
        "j_hub_optimization_analyze",
        {
          body: {
            recording_id: recordingId,
            model: selectedModel,
            correction_prompt: correctionPrompt.trim() || undefined,
          },
        }
      );

      if (functionError) throw functionError;

      toast.success("Análise regenerada com sucesso!");
      onRegenerateSuccess();
      onClose();
    } catch (err) {
      console.error("Analysis regeneration error:", err);
      const errorMessage = err.message || "Erro ao regenerar análise";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Regenerar Análise de IA
          </DialogTitle>
          <DialogDescription>
            Escolha um modelo e adicione instruções opcionais para melhorar a análise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Modelo de IA *
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
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

          <div>
            <label className="text-sm font-medium mb-2 block">
              Prompt Corretivo (Opcional)
            </label>
            <Textarea
              placeholder="Exemplo: Dê mais ênfase às métricas de conversão. Analise melhor a estratégia de segmentação..."
              value={correctionPrompt}
              onChange={(e) => setCorrectionPrompt(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use este campo para dar instruções específicas sobre como a IA deve melhorar a análise.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRegenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !selectedModel}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerar Análise
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
