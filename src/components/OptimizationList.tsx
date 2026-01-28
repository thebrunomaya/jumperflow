/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OptimizationList - Week 1 MVP Component
 * 
 * Lists optimization recordings for a specific account
 * Shows audio player and processing status
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JumperButton } from "@/components/ui/jumper-button";
import { Loader2, Clock, AlertCircle, FileText, Brain, MoreVertical, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OptimizationRecordingRow, OptimizationTranscriptRow, OptimizationContext, rowToOptimizationContext } from "@/types/optimization";
import { OptimizationContextCard } from "@/components/OptimizationContextCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface OptimizationListProps {
  accountId: string;
  onRefresh?: () => void;
}

export function OptimizationList({ accountId, onRefresh }: OptimizationListProps) {
  const [recordings, setRecordings] = useState<OptimizationRecordingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [transcribing, setTranscribing] = useState<Record<string, boolean>>({});
  const [transcripts, setTranscripts] = useState<Record<string, OptimizationTranscriptRow>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [contexts, setContexts] = useState<Record<string, OptimizationContext>>({});

  // Fetch recordings when account changes
   
  useEffect(() => {
    if (accountId) {
      fetchRecordings();
    }
  }, [accountId]);

  async function fetchRecordings() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("j_hub_optimization_recordings")
      .select("*")
      .eq("account_id", accountId)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching recordings:", error);
      setIsLoading(false);
      return;
    }

    setRecordings((data || []) as OptimizationRecordingRow[]);

    // Generate signed URLs for audio files
    const urls: Record<string, string> = {};
    for (const recording of data || []) {
      if (recording.audio_file_path) {
        const { data: signedUrl } = await supabase.storage
          .from("optimizations")
          .createSignedUrl(recording.audio_file_path, 3600); // 1 hour

        if (signedUrl) {
          urls[recording.id] = signedUrl.signedUrl;
        }
      }
    }

    setAudioUrls(urls);

    // Fetch transcripts for completed transcriptions
    const completedRecordings = (data || []).filter(
      r => r.transcription_status === 'completed'
    );
    
    if (completedRecordings.length > 0) {
      const { data: transcriptsData } = await supabase
        .from('j_hub_optimization_transcripts')
        .select('*')
        .in('recording_id', completedRecordings.map(r => r.id));

      if (transcriptsData) {
        const transcriptsMap: Record<string, OptimizationTranscriptRow> = {};
        transcriptsData.forEach(t => {
          transcriptsMap[t.recording_id] = t;
        });
        setTranscripts(transcriptsMap);
      }
    }

    // Fetch contexts for completed analyses
    const analyzedRecordings = (data || []).filter(
      r => r.analysis_status === 'completed'
    );

    if (analyzedRecordings.length > 0) {
      const { data: contextsData } = await supabase
        .from('j_hub_optimization_context')
        .select('*')
        .in('recording_id', analyzedRecordings.map(r => r.id));

      if (contextsData) {
        const contextsMap: Record<string, OptimizationContext> = {};
        contextsData.forEach(c => {
          contextsMap[c.recording_id] = rowToOptimizationContext(c);
        });
        setContexts(contextsMap);
      }
    }

    setIsLoading(false);
  }

  async function handleTranscribe(recordingId: string) {
    setTranscribing(prev => ({ ...prev, [recordingId]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_transcribe', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success('Transcrição concluída!');
      
      // Reload recordings to show updated status
      fetchRecordings();
      onRefresh?.();
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Erro ao transcrever áudio');
    } finally {
      setTranscribing(prev => ({ ...prev, [recordingId]: false }));
    }
  }

  async function handleAnalyze(recordingId: string) {
    setAnalyzing(prev => ({ ...prev, [recordingId]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('j_hub_optimization_analyze', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success('Análise com IA concluída!');
      
      // Reload recordings to get updated context
      fetchRecordings();
      onRefresh?.();
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Erro ao analisar transcrição');
    } finally {
      setAnalyzing(prev => ({ ...prev, [recordingId]: false }));
    }
  }

  async function handleDelete(recordingId: string) {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    const confirmDelete = window.confirm(
      'Tem certeza que deseja apagar esta gravação? Esta ação não pode ser desfeita.'
    );

    if (!confirmDelete) return;

    try {
      // Delete audio file from storage if it exists
      if (recording.audio_file_path) {
        const { error: storageError } = await supabase.storage
          .from('optimizations')
          .remove([recording.audio_file_path]);
        
        if (storageError) {
          console.error('Error deleting audio file:', storageError);
          // Continue with deletion even if storage fails
        }
      }

      // Delete recording (cascade will delete context and transcript)
      const { error: deleteError } = await supabase
        .from('j_hub_optimization_recordings')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      toast.success('Gravação apagada com sucesso!');
      
      // Reload recordings
      fetchRecordings();
      onRefresh?.();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao apagar gravação');
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "outline", label: "Concluído" },
      failed: { variant: "destructive", label: "Falha" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recordings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma gravação encontrada para esta conta
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recordings List */}
        {!isLoading && recordings.length > 0 && (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <Card key={recording.id} className="border-l-4 border-l-primary/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(recording.recorded_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">
                          Por: <span className="font-medium">{recording.recorded_by}</span>
                        </p>
                        {recording.duration_seconds && (
                          <p className="text-sm text-muted-foreground">
                            Duração: {Math.floor(recording.duration_seconds / 60)}:
                            {(recording.duration_seconds % 60).toString().padStart(2, "0")}
                          </p>
                        )}
                      </div>

                      {/* Status Badges & Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(recording.transcription_status)}
                          {getStatusBadge(recording.analysis_status)}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <JumperButton variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </JumperButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {recording.transcription_status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleTranscribe(recording.id)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Transcrever
                                </DropdownMenuItem>
                              )}
                              {recording.transcription_status === 'completed' && transcripts[recording.id] && (
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transcripts[recording.id].full_text)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copiar Transcrição
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(recording.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Apagar Gravação
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {audioUrls[recording.id] && (
                      <div className="p-3 bg-muted rounded-lg">
                        <audio controls src={audioUrls[recording.id]} className="w-full" />
                      </div>
                    )}

                    {!audioUrls[recording.id] && recording.audio_file_path && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                        Carregando áudio...
                      </div>
                    )}

                    {/* Transcript Display */}
                    {recording.transcription_status === 'completed' && transcripts[recording.id] && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-primary" />
                          Transcrição
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {transcripts[recording.id].full_text}
                          </p>
                          {transcripts[recording.id].confidence_score && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Confiança: {(Number(transcripts[recording.id].confidence_score) * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Analyze Button */}
                        {recording.analysis_status === 'pending' && (
                          <JumperButton
                            onClick={() => handleAnalyze(recording.id)}
                            disabled={analyzing[recording.id]}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            {analyzing[recording.id] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analisando com IA...
                              </>
                            ) : (
                              <>
                                <Brain className="mr-2 h-4 w-4" />
                                Analisar com IA
                              </>
                            )}
                          </JumperButton>
                        )}
                      </div>
                    )}

                    {/* Context Display */}
                    {recording.analysis_status === 'completed' && contexts[recording.id] && (
                      <div className="mt-4">
                        <OptimizationContextCard context={contexts[recording.id]} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
