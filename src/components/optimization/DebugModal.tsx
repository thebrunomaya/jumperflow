/* eslint-disable react-hooks/exhaustive-deps */
/**
 * DebugModal - Shows AI API logs for debugging (Admin only)
 * Displays prompts, responses, tokens, latency for each step
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bug, Loader2, AlertCircle } from "lucide-react";

interface DebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  step: 'transcribe' | 'process' | 'analyze' | 'improve_transcript' | 'improve_processed' | string[];
}

interface APILog {
  id: string;
  recording_id: string;
  step: string;
  prompt_sent: string | null;
  model_used: string | null;
  input_preview: string | null;
  output_preview: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const stepLabels: Record<string, string> = {
  transcribe: 'Passo 1: Transcrição (Whisper)',
  enhance_transcription: 'Enhancement (Claude Sonnet 4.5)',
  process: 'Passo 2: Processamento (Claude Bullets)',
  analyze: 'Passo 3: Análise (IA)',
  extract: 'Passo 3: Geração de Extrato (Claude)',
  improve_transcript: 'Ajuste de Transcrição com IA (Claude)',
  improve_processed: 'Ajuste de Bullets com IA (Claude)',
};

export function DebugModal({ open, onOpenChange, recordingId, step }: DebugModalProps) {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

   
  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, step, recordingId]);

  async function fetchLogs() {
    setIsLoading(true);
    try {
      // Support both single step and array of steps
      const steps = Array.isArray(step) ? step : [step];

      const { data, error } = await supabase
        .from('j_hub_optimization_api_logs')
        .select('*')
        .eq('recording_id', recordingId)
        .in('step', steps)
        .order('created_at', { ascending: true }); // Show in chronological order

      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      setLogs((data || []) as APILog[]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug - {Array.isArray(step)
              ? `Múltiplos Steps (${step.length})`
              : stepLabels[step] || step}
          </DialogTitle>
        </DialogHeader>

        <div className="pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Nenhum log encontrado para esta etapa</p>
              <p className="text-xs mt-2">
                Logs serão criados quando a função for executada
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className={log.success ? '' : 'border-destructive'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-mono">
                          {new Date(log.created_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                          })}
                        </CardTitle>
                        {Array.isArray(step) && (
                          <Badge variant="secondary" className="text-xs">
                            {stepLabels[log.step] || log.step}
                          </Badge>
                        )}
                      </div>
                      {log.success ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          ✓ Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ✗ Erro
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Input Preview */}
                    {log.input_preview && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          📥 Input (preview)
                        </Label>
                        <Textarea
                          readOnly
                          value={log.input_preview}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={8}
                        />
                      </div>
                    )}

                    {/* Prompt Sent */}
                    {log.prompt_sent && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          💬 Prompt Enviado para API
                        </Label>
                        <Textarea
                          readOnly
                          value={log.prompt_sent}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={20}
                        />
                      </div>
                    )}

                    {/* Output Preview */}
                    {log.output_preview && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          📤 Output (preview)
                        </Label>
                        <Textarea
                          readOnly
                          value={log.output_preview}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={15}
                        />
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-4 gap-3 pt-2 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Modelo</Label>
                        <p className="font-mono text-sm font-medium truncate" title={log.model_used || 'N/A'}>
                          {log.model_used || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tokens</Label>
                        <p className="font-mono text-sm font-medium">
                          {log.tokens_used !== null ? log.tokens_used.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Latência</Label>
                        <p className="font-mono text-sm font-medium">
                          {log.latency_ms !== null ? `${log.latency_ms}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">ID</Label>
                        <p className="font-mono text-xs truncate" title={log.id}>
                          {log.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {log.error_message && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {log.error_message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
