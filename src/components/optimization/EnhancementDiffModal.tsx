/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EnhancementDiffModal - Shows AI enhancement changes with revert option
 * Displays diff view and allows reverting to original Whisper transcription
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
import { DiffView } from "./DiffView";
import { Bot, Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancementDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  originalText: string;
  enhancedText: string;
  onRevert: () => Promise<void>;
}

export function EnhancementDiffModal({
  isOpen,
  onClose,
  recordingId,
  originalText,
  enhancedText,
  onRevert,
}: EnhancementDiffModalProps) {
  const { user } = useAuth();
  const [isReverting, setIsReverting] = useState(false);

  async function handleRevert() {
    if (!recordingId || !user?.id) return;

    setIsReverting(true);
    try {
      await onRevert();
      onClose();
    } catch (error: any) {
      console.error('Revert error:', error);
      toast.error('Erro ao reverter para original');
    } finally {
      setIsReverting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Ajustes Automáticos da IA
          </DialogTitle>
          <DialogDescription>
            Verde = corrigido pela IA | Vermelho riscado = original do Whisper
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-muted/30 max-h-[500px] overflow-y-auto">
          <DiffView
            oldText={originalText}
            newText={enhancedText}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <JumperButton
            variant="ghost"
            onClick={onClose}
          >
            Fechar
          </JumperButton>

          <JumperButton
            variant="outline"
            onClick={handleRevert}
            disabled={isReverting}
          >
            {isReverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revertendo...
              </>
            ) : (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                Reverter para Original
              </>
            )}
          </JumperButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
