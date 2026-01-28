/**
 * AnalysisRegenerationCard - Allows user to regenerate AI analysis with different models
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

interface AnalysisRegenerationCardProps {
  recordingId: string;
  onRegenerateSuccess: () => void;
}

const AI_MODELS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Recomendado)" },
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (Padrão)" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4 (Mais Inteligente)" },
] as const;

export function AnalysisRegenerationCard({
  recordingId,
  onRegenerateSuccess,
}: AnalysisRegenerationCardProps) {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4.1-2025-04-14");
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
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

      onRegenerateSuccess();
      setCorrectionPrompt("");
    } catch (err) {
      console.error("Analysis regeneration error:", err);
      setError(err.message || "Erro ao regenerar análise");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Regenerar Análise de IA
        </CardTitle>
        <CardDescription className="text-xs">
          Escolha um modelo e adicione instruções para melhorar a análise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Modelo de IA</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value} className="text-sm">
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">
            Prompt Corretivo (Opcional)
          </label>
          <Textarea
            placeholder="Exemplo: Dê mais ênfase às métricas de conversão. Analise melhor a estratégia de segmentação..."
            value={correctionPrompt}
            onChange={(e) => setCorrectionPrompt(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="w-full"
          size="sm"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Regenerando Análise...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              Regenerar com {AI_MODELS.find(m => m.value === selectedModel)?.label}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
