/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Info, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeckRefineModalProps {
  deckId: string;
  currentVersion: number;
  onRefineComplete?: (newVersion: number, changesSummary: string) => void;
  trigger?: React.ReactNode; // Custom trigger button
}

export function DeckRefineModal({
  deckId,
  currentVersion,
  onRefineComplete,
  trigger,
}: DeckRefineModalProps) {
  const [open, setOpen] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle refinement submission
  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      toast.error("Por favor, descreva as mudanças que deseja fazer");
      return;
    }

    try {
      setIsRefining(true);
      setError(null);

      console.log("🔧 Starting deck refinement...", { deckId, refinementPrompt });

      // Call Edge Function to refine deck
      const { data, error: refineError } = await supabase.functions.invoke(
        "j_hub_deck_refine",
        {
          body: {
            deck_id: deckId,
            refinement_prompt: refinementPrompt,
          },
        }
      );

      if (refineError) throw refineError;

      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao refinar deck");
      }

      console.log("✅ Deck refined successfully:", data);

      // Show success toast with changes summary
      toast.success(
        <div>
          <p className="font-semibold">Deck refinado com sucesso!</p>
          <p className="text-sm mt-1">{data.changes_summary}</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Nova versão: v{data.new_version}
          </p>
        </div>,
        { duration: 5000 }
      );

      // Callback to parent (refresh deck data)
      if (onRefineComplete) {
        onRefineComplete(data.new_version, data.changes_summary);
      }

      // Reset form and close modal
      setRefinementPrompt("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error refining deck:", error);
      setError(error.message || "Erro ao refinar deck");
      toast.error(`Erro ao refinar deck: ${error.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Example prompts for inspiration
  const examplePrompts = [
    "Aumentar o tamanho do título no slide 1 e deixá-lo em negrito",
    "Mudar a cor de fundo do slide 3 para um azul mais escuro",
    "Reorganizar os slides: colocar o slide 5 antes do slide 3",
    "Adicionar mais espaçamento entre os itens da lista no slide 4",
    "Mudar a fonte do texto dos cards para uma fonte mais moderna",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Sparkles className="h-4 w-4 mr-2" />
            Refinar com IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Refinar Deck com IA
          </DialogTitle>
          <DialogDescription>
            Descreva as mudanças que deseja fazer no deck. A IA aplicará os refinamentos
            e criará uma nova versão (v{currentVersion + 1}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Refinement prompt input */}
          <div className="space-y-2">
            <Label htmlFor="refinement-prompt">
              O que você quer mudar no deck?
            </Label>
            <Textarea
              id="refinement-prompt"
              placeholder="Ex: Aumentar o tamanho do título no slide 1 e mudar a cor do fundo do slide 3 para azul escuro..."
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              rows={6}
              disabled={isRefining}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Seja específico sobre quais slides ou elementos você quer mudar.
            </p>
          </div>

          {/* Example prompts */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Exemplos de refinamentos:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                {examplePrompts.slice(0, 3).map((example, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setRefinementPrompt(example)}
                      className="text-left hover:underline"
                      disabled={isRefining}
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Info about versioning */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium">Como funciona:</p>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Uma nova versão (v{currentVersion + 1}) será criada</li>
                <li>A versão anterior (v{currentVersion}) será preservada</li>
                <li>Você pode voltar para versões antigas a qualquer momento</li>
                <li>
                  Processamento leva ~30-60 segundos (depende do tamanho do deck)
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRefining}
          >
            Cancelar
          </Button>
          <Button onClick={handleRefine} disabled={isRefining || !refinementPrompt.trim()}>
            {isRefining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refinando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Aplicar Refinamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
