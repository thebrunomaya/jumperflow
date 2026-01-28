/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OptimizationEditor - Fullscreen editor for optimization recordings
 * Replaces the drawer with a dedicated page with 3 independent sections
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { JumperBackground } from "@/components/ui/jumper-background";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizationStepCard } from "@/components/optimization/OptimizationStepCard";
import { DebugModal } from "@/components/optimization/DebugModal";
import { OptimizationContextCard } from "@/components/OptimizationContextCard";
import { AIImprovementsModal } from "@/components/optimization/AIImprovementsModal";
import { RetranscribeConfirmModal } from "@/components/optimization/RetranscribeConfirmModal";
import { AIProcessImprovementsModal } from "@/components/optimization/AIProcessImprovementsModal";
import { ReprocessConfirmModal } from "@/components/optimization/ReprocessConfirmModal";
import { EnhancementDiffModal } from "@/components/optimization/EnhancementDiffModal";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
  rowToOptimizationContext,
} from "@/types/optimization";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Mic,
  FileText,
  Brain,
  Save,
  RotateCw,
  Sparkles,
  Share2,
  Download,
  Edit,
  Loader2,
  Undo2,
  Lock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { exportOptimizationToPDF } from "@/utils/pdfExport";
import { ShareOptimizationModal } from "@/components/optimization/ShareOptimizationModal";
import { ExtractEditorModal } from "@/components/optimization/ExtractEditorModal";
import { AIAnalysisImprovementsModal } from "@/components/optimization/AIAnalysisImprovementsModal";
import { LogViewer } from "@/components/optimization/LogViewer";
import { LogEditorModal } from "@/components/optimization/LogEditorModal";
import { TranscriptViewer } from "@/components/optimization/TranscriptViewer";
import { TranscriptEditorModal } from "@/components/optimization/TranscriptEditorModal";
import { ExtractViewer } from "@/components/optimization/ExtractViewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AI_MODELS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Recomendado)" },
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4" },
] as const;

export default function OptimizationEditor() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Data states
  const [recording, setRecording] = useState<OptimizationRecordingRow | null>(null);
  const [transcript, setTranscript] = useState<OptimizationTranscriptRow | null>(null);
  const [context, setContext] = useState<OptimizationContext | null>(null);
  const [extract, setExtract] = useState<{ extract_text: string; edit_count: number; updated_at: string; previous_version?: string } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>("");

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingExtract, setIsGeneratingExtract] = useState(false);

  // Edit states
  const [editedTranscript, setEditedTranscript] = useState("");
  const [editedProcessed, setEditedProcessed] = useState("");

  // Analysis model selection
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-5-20250929");

  // Debug modal
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugStep, setDebugStep] = useState<'transcribe' | 'process' | 'analyze' | 'improve_transcript' | 'improve_processed' | string[]>('transcribe');

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Extract editor modal
  const [extractEditorModalOpen, setExtractEditorModalOpen] = useState(false);

  // AI analysis improvements modal
  const [aiAnalysisImprovementsModalOpen, setAiAnalysisImprovementsModalOpen] = useState(false);

  // AI improvements modal
  const [aiImprovementsModalOpen, setAiImprovementsModalOpen] = useState(false);
  const [originalWhisperPrompt, setOriginalWhisperPrompt] = useState<string>("");

  // Retranscribe confirm modal
  const [retranscribeModalOpen, setRetranscribeModalOpen] = useState(false);
  const [isRetranscribing, setIsRetranscribing] = useState(false);

  // AI improvements modal for Step 2 (processed text)
  const [aiProcessImprovementsModalOpen, setAiProcessImprovementsModalOpen] = useState(false);

  // Reprocess confirm modal
  const [reprocessModalOpen, setReprocessModalOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Enhancement diff modal (to show AI changes)
  const [enhancementDiffModalOpen, setEnhancementDiffModalOpen] = useState(false);

  // Log editor modal (Step 2)
  const [logEditorModalOpen, setLogEditorModalOpen] = useState(false);

  // Transcript editor modal (Step 1)
  const [transcriptEditorModalOpen, setTranscriptEditorModalOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine which step should be open by default (highest completed step)
  const getDefaultOpenStep = (): number => {
    if (extract?.extract_text) return 3; // Step 3 has content
    if (transcript?.processed_text) return 2; // Step 2 has content
    if (transcript?.full_text) return 1; // Step 1 has content
    return 0; // Nothing completed, all closed
  };

  const defaultOpenStep = getDefaultOpenStep();

  // Load data on mount
   
  useEffect(() => {
    if (recordingId) {
      loadRecording();
    }
  }, [recordingId]);

  async function loadRecording() {
    if (!recordingId) return;

    setIsLoadingData(true);
    try {
      // Fetch recording
      const { data: recordingData, error: recordingError } = await supabase
        .from('j_hub_optimization_recordings')
        .select('*')
        .eq('id', recordingId)
        .single();

      if (recordingError) throw recordingError;
      setRecording(recordingData as OptimizationRecordingRow);

      // Fetch account name
      const { data: accountData } = await supabase
        .from('j_hub_notion_db_accounts')
        .select('Conta')
        .eq('id', recordingData.account_id)
        .maybeSingle();

      setAccountName(accountData?.Conta || 'Unknown');

      // Fetch audio URL
      if (recordingData.audio_file_path) {
        const { data: signedUrl } = await supabase.storage
          .from('optimizations')
          .createSignedUrl(recordingData.audio_file_path, 3600);
        if (signedUrl) setAudioUrl(signedUrl.signedUrl);
      }

      // Fetch transcript
      const { data: transcriptData } = await supabase
        .from('j_hub_optimization_transcripts')
        .select('*')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (transcriptData) {
        setTranscript(transcriptData as OptimizationTranscriptRow);
        setEditedTranscript(transcriptData.full_text || '');
        setEditedProcessed(transcriptData.processed_text || '');
      }

      // Fetch context
      const { data: contextData } = await supabase
        .from('j_hub_optimization_context')
        .select('*')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (contextData) {
        setContext(rowToOptimizationContext(contextData));
      }

      // Fetch extract
      const { data: extractData } = await supabase
        .from('j_hub_optimization_extracts')
        .select('extract_text, edit_count, updated_at, previous_version')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (extractData) {
        setExtract(extractData);
      }

      // Fetch original Whisper prompt from transcribe log
      const { data: transcribeLog } = await supabase
        .from('j_hub_optimization_api_logs')
        .select('prompt_sent')
        .eq('recording_id', recordingId)
        .eq('step', 'transcribe')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transcribeLog?.prompt_sent) {
        setOriginalWhisperPrompt(transcribeLog.prompt_sent);
      }
    } catch (error) {
      console.error('Error loading recording:', error);
      toast.error('Erro ao carregar gravação');
    } finally {
      setIsLoadingData(false);
    }
  }

  // Step 1: Transcribe
  async function handleTranscribe(regenerate = false) {
    if (!recordingId) return;

    setIsTranscribing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_transcribe', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Transcrição regerada!' : 'Transcrição concluída!');
      await loadRecording();
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Erro ao transcrever');
    } finally {
      setIsTranscribing(false);
    }
  }

  // Step 1: Save edited transcript
  async function handleSaveTranscript(newText: string) {
    if (!recordingId || !user?.id) return;

    try {
      const { data, error } = await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: newText,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Update local state immediately with returned data
      if (data && data.length > 0 && transcript) {
        const updated = data[0];
        setTranscript({
          ...transcript,
          full_text: updated.full_text,
          previous_version: updated.previous_version,
          edit_count: updated.edit_count,
          last_edited_at: updated.last_edited_at,
          last_edited_by: updated.last_edited_by,
        });
        setEditedTranscript(updated.full_text);
      }

      toast.success('Transcrição salva!');
    } catch (error: any) {
      console.error('Save transcript error:', error);
      toast.error('Erro ao salvar transcrição');
    }
  }

  // Step 1: Apply AI improvements
  async function handleApplyAIImprovements(improvedText: string) {
    if (!recordingId || !user?.id) return;

    try {
      const { error } = await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: improvedText,
        p_user_id: user.id,
      });

      if (error) throw error;

      setEditedTranscript(improvedText);
      await loadRecording();
    } catch (error: any) {
      console.error('Apply AI improvements error:', error);
      toast.error('Erro ao aplicar melhorias');
    }
  }

  // Step 1: Retranscribe with confirmation
  async function handleRetranscribe() {
    if (!recordingId || !user?.id) return;

    setIsRetranscribing(true);
    try {
      // Save current version as backup before retranscribing
      await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: editedTranscript,
        p_user_id: user.id,
      });

      // Call transcribe function directly (uses UPSERT now, no DELETE needed)
      const { error } = await supabase.functions.invoke(
        'j_hub_optimization_transcribe',
        {
          body: { recording_id: recordingId }
        }
      );

      if (error) throw error;

      toast.success('Transcrição recriada com sucesso!');
      setRetranscribeModalOpen(false);
      await loadRecording();
    } catch (error: any) {
      console.error('Retranscribe error:', error);
      toast.error('Erro ao recriar transcrição');
    } finally {
      setIsRetranscribing(false);
    }
  }

  // Step 1: Undo to previous version
  async function handleUndo() {
    if (!recordingId || !transcript?.previous_version) return;

    try {
      const { error } = await supabase
        .from('j_hub_optimization_transcripts')
        .update({
          full_text: transcript.previous_version,
          previous_version: null,
          edit_count: Math.max(0, (transcript.edit_count || 1) - 1),
          last_edited_at: new Date().toISOString(),
          last_edited_by: user?.id || null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Versão anterior restaurada!');
      await loadRecording();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast.error('Erro ao desfazer');
    }
  }

  // Step 1: Revert to original Whisper transcription (before AI enhancement)
  async function handleRevertToOriginal() {
    if (!recordingId || !transcript?.original_text) return;

    try {
      const { error } = await supabase
        .from('j_hub_optimization_transcripts')
        .update({
          previous_version: transcript.full_text, // Save current as previous for undo
          full_text: transcript.original_text,  // Revert to raw Whisper output
          edit_count: (transcript.edit_count || 0) + 1,
          last_edited_at: new Date().toISOString(),
          last_edited_by: user?.id || null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Revertido para transcrição original do Whisper!');
      await loadRecording();
    } catch (error: any) {
      console.error('Revert error:', error);
      toast.error('Erro ao reverter');
    }
  }

  // Step 2: Process transcript
  async function handleProcess(regenerate = false) {
    if (!recordingId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_process', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Bullets regenerados!' : 'Organizado em tópicos!');
      await loadRecording();
    } catch (error: any) {
      console.error('Process error:', error);
      toast.error(error.message || 'Erro ao processar');
    } finally {
      setIsProcessing(false);
    }
  }

  // Step 2: Save edited processed text (with versioning)
  async function handleSaveProcessed(newText: string) {
    if (!recordingId || !user) return;

    try {
      const { data, error } = await supabase.rpc('save_processed_edit', {
        p_recording_id: recordingId,
        p_new_text: newText,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Update local state immediately with returned data
      if (data && data.length > 0 && transcript) {
        const updated = data[0];
        setTranscript({
          ...transcript,
          processed_text: updated.processed_text,
          processed_previous_version: updated.processed_previous_version,
          processed_edit_count: updated.processed_edit_count,
          processed_last_edited_at: updated.processed_last_edited_at,
        });
        setEditedProcessed(updated.processed_text);
      }

      toast.success('Bullets salvos!');
    } catch (error: any) {
      console.error('Save processed error:', error);
      toast.error('Erro ao salvar bullets');
    }
  }

  // Step 2: Apply AI improvements to processed text
  async function handleApplyProcessedImprovements(improvedText: string) {
    if (!recordingId || !user) return;

    try {
      const { error } = await supabase.rpc('save_processed_edit', {
        p_recording_id: recordingId,
        p_new_text: improvedText,
        p_user_id: user.id,
      });

      if (error) throw error;

      await loadRecording();
    } catch (error: any) {
      console.error('Apply improvements error:', error);
      throw error;
    }
  }

  // Step 2: Reprocess with IA (regenerate)
  async function handleReprocess() {
    if (!recordingId || !user) return;

    setIsReprocessing(true);
    try {
      // Save current as backup before reprocessing
      if (transcript?.processed_text) {
        await supabase.rpc('save_processed_edit', {
          p_recording_id: recordingId,
          p_new_text: transcript.processed_text,
          p_user_id: user.id,
        });
      }

      // Call process function directly (simpler than going through improve_processed)
      const { error } = await supabase.functions.invoke(
        'j_hub_optimization_process',
        {
          body: {
            recording_id: recordingId,
          },
        }
      );

      if (error) throw error;

      toast.success('Bullets reprocessados!');
      await loadRecording();
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast.error('Erro ao reprocessar: ' + error.message);
    } finally {
      setIsReprocessing(false);
    }
  }

  // Step 2: Undo processed edit (restore previous version)
  async function handleUndoProcessed() {
    if (!recordingId || !transcript?.processed_previous_version) return;

    try {
      const { error } = await supabase
        .from('j_hub_optimization_transcripts')
        .update({
          processed_text: transcript.processed_previous_version,
          processed_previous_version: null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Versão anterior restaurada!');
      await loadRecording();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast.error('Erro ao desfazer');
    }
  }

  // Step 3: Analyze
  async function handleAnalyze(regenerate = false) {
    if (!recordingId) return;

    setIsAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_analyze', {
        body: {
          recording_id: recordingId,
          model: selectedModel,
        }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Análise regenerada!' : 'Análise concluída!');
      await loadRecording();
    } catch (error: any) {
      console.error('Analyze error:', error);
      toast.error(error.message || 'Erro ao analisar');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Debug modal handlers
  function openDebug(step: 'transcribe' | 'process' | 'analyze' | 'extract') {
    // For transcribe step, show both Whisper and Enhancement logs
    if (step === 'transcribe') {
      setDebugStep(['transcribe', 'enhance_transcription']);
    } else {
      setDebugStep(step);
    }
    setDebugModalOpen(true);
  }

  // Export handlers
  function handleExportPDF() {
    if (!recording || !accountName) return;
    exportOptimizationToPDF(recording, accountName, transcript, extract, context);
    toast.success('PDF completo gerado com sucesso!');
  }

  function handleShare() {
    setShareModalOpen(true);
  }

  // Copy handlers
  async function handleCopyTranscript() {
    if (!transcript?.transcript) return;

    try {
      await navigator.clipboard.writeText(transcript.transcript);
      toast.success('Transcrição copiada!');
    } catch (error) {
      toast.error('Erro ao copiar transcrição');
    }
  }

  async function handleCopyLog() {
    if (!transcript?.processed_text) return;

    try {
      await navigator.clipboard.writeText(transcript.processed_text);
      toast.success('Log copiado!');
    } catch (error) {
      toast.error('Erro ao copiar log');
    }
  }

  async function handleCopyExtract() {
    if (!extract?.extract_text) return;

    try {
      await navigator.clipboard.writeText(extract.extract_text);
      toast.success('Extrato copiado!');
    } catch (error) {
      toast.error('Erro ao copiar extrato');
    }
  }

  // Delete handlers
  async function handleDeleteOptimization() {
    if (!recordingId || !recording) return;

    setIsDeleting(true);
    try {
      // Delete audio file from storage
      const audioPath = recording.audio_file_path;
      if (audioPath) {
        const { error: storageError } = await supabase.storage
          .from('optimizations')
          .remove([audioPath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with record deletion even if storage fails
        }
      }

      // Delete database record (cascade will delete related records)
      const { error: deleteError } = await supabase
        .from('j_hub_optimization_recordings')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      toast.success('Otimização excluída com sucesso!');
      navigate('/optimization');
    } catch (error: any) {
      console.error('Delete optimization error:', error);
      toast.error(error.message || 'Erro ao excluir otimização');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  // Extract handlers (Step 3)
  async function handleGenerateExtract() {
    if (!recordingId || !transcript?.processed_text) return;

    setIsGeneratingExtract(true);
    try {
      const { data, error } = await supabase.functions.invoke('j_hub_optimization_extract', {
        body: {
          recordingId,
          contextText: transcript.processed_text,
          forceRegenerate: true,
        }
      });

      if (error) throw error;

      toast.success('Extrato gerado com sucesso!');
      await loadRecording();

      // Close modal after successful generation
      setExtractEditorModalOpen(false);
    } catch (error: any) {
      console.error('Extract generation error:', error);
      toast.error(error.message || 'Erro ao gerar extrato');
      // Keep modal open on error so user can try again
    } finally {
      setIsGeneratingExtract(false);
    }
  }

  async function handleSaveExtract(newText: string) {
    if (!recordingId || !extract) return;

    try {
      const { data, error } = await supabase
        .from('j_hub_optimization_extracts')
        .update({
          extract_text: newText,
          previous_version: extract.extract_text,
          edit_count: extract.edit_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('recording_id', recordingId)
        .select('extract_text, edit_count, updated_at, previous_version')
        .single();

      if (error) throw error;

      // Update local state immediately with returned data
      if (data) {
        setExtract(data);
      }

      toast.success('Extrato salvo!');
    } catch (error: any) {
      console.error('Save extract error:', error);
      toast.error('Erro ao salvar extrato');
    }
  }

  async function handleUndoExtract() {
    if (!recordingId || !extract?.previous_version) return;

    try {
      const { error } = await supabase
        .from('j_hub_optimization_extracts')
        .update({
          extract_text: extract.previous_version,
          previous_version: null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Extrato restaurado!');
      await loadRecording();
    } catch (error: any) {
      console.error('Undo extract error:', error);
      toast.error('Erro ao desfazer');
    }
  }

  function handleAdjustWithAI() {
    setAiAnalysisImprovementsModalOpen(true);
  }

  async function handleApplyAnalysisImprovements(improvedContext: OptimizationContext) {
    setContext(improvedContext);
    toast.success('Análise ajustada! Recarregue a página para ver as alterações.');
  }

  if (isLoadingData) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </JumperBackground>
    );
  }

  if (!recording) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center">
          <p className="text-muted-foreground mb-4">Gravação não encontrada</p>
          <JumperButton onClick={() => navigate('/optimization')}>
            Voltar para Lista
          </JumperButton>
        </div>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      {/* Header - Breadcrumb Navigation Pattern */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb and action buttons row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => navigate('/optimization')}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-base"
                >
                  Otimizações
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                <h1 className="text-base font-bold text-foreground">
                  Edição de Otimização - {accountName}
                </h1>
              </div>

              {/* Timestamp row */}
              <p className="text-sm text-muted-foreground/80 mt-1 font-medium">
                {(() => {
                  const recordedDate = new Date(recording.recorded_at);
                  const now = new Date();
                  const diffMs = now.getTime() - recordedDate.getTime();
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                  if (diffDays === 0) {
                    return `Gravado hoje às ${recordedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (diffDays === 1) {
                    return `Gravado ontem às ${recordedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (diffDays < 7) {
                    return `Gravado há ${diffDays} dias`;
                  } else {
                    return `Gravado em ${recordedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às ${recordedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                  }
                })()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Primary Action - Export PDF */}
              <JumperButton
                variant="default"
                size="sm"
                onClick={handleExportPDF}
                disabled={!extract || recording.analysis_status !== 'completed'}
                title={!extract ? "Complete o Step 3 (Extrato) para exportar PDF" : "Gerar PDF completo com todos os dados da otimização"}
                className="min-w-[140px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </JumperButton>

              {/* Destructive Action - Delete */}
              <JumperButton
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Excluir permanentemente esta otimização"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </JumperButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* SEÇÃO 3: EXTRATO (TOPO - Mais refinado) */}
          <OptimizationStepCard
            stepNumber={3}
            title="Extrato da Otimização"
            description="Resumo das ações realizadas"
            status={recording.analysis_status}
            onEdit={() => setExtractEditorModalOpen(true)}
            onCopy={handleCopyExtract}
            isEditDisabled={recording.analysis_status !== 'completed'}
            onDebug={isAdmin ? () => openDebug('extract') : undefined}
            defaultCollapsed={defaultOpenStep !== 3}
          >
            {/* Pending State - Locked if Step 2 not completed */}
            {recording.analysis_status === 'pending' && recording.processing_status !== 'completed' && (
              <div className="text-center py-8 space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Complete o <strong>Step 2 (Log da Otimização)</strong> primeiro
                </p>
              </div>
            )}

            {/* Pending State - Ready to extract */}
            {recording.analysis_status === 'pending' && recording.processing_status === 'completed' && (
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Log organizado. Gere o extrato de ações realizadas.
                </p>
                <JumperButton
                  onClick={() => handleGenerateExtract()}
                  disabled={isGeneratingExtract || !transcript?.processed_text}
                  size="lg"
                >
                  {isGeneratingExtract ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Extrato...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Extrato com IA
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Failed State */}
            {recording.analysis_status === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive opacity-70" />
                <div className="space-y-2">
                  <p className="text-destructive font-medium">
                    Falha ao gerar extrato
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Use o ícone de debug acima para ver detalhes do erro
                    </p>
                  )}
                </div>
                <JumperButton
                  onClick={() => handleGenerateExtract()}
                  disabled={isGeneratingExtract || !transcript?.processed_text}
                  variant="default"
                  size="lg"
                >
                  {isGeneratingExtract ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Completed State */}
            {recording.analysis_status === 'completed' && extract && (
              <div className="space-y-6">
                {/* Extract Viewer */}
                <ExtractViewer content={extract.extract_text} />

                {/* Share Button */}
                <div className="flex justify-end pt-4 border-t">
                  <JumperButton onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </JumperButton>
                </div>
              </div>
            )}
          </OptimizationStepCard>

          {/* Arrow Up - Fluxo de refinamento (Step 3 ← Step 2) */}
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="h-4 w-px bg-gradient-to-b from-border to-transparent" />
            <ChevronUp className="h-8 w-8 text-muted-foreground animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium">Refina em</p>
          </div>

          {/* SEÇÃO 2: LOG DA OTIMIZAÇÃO (MEIO - Intermediário) */}
          <OptimizationStepCard
            stepNumber={2}
            title="Log da Otimização"
            description="Diário detalhado das ações"
            status={recording.processing_status}
            onEdit={() => setLogEditorModalOpen(true)}
            onCopy={handleCopyLog}
            isEditDisabled={recording.processing_status !== 'completed'}
            onDebug={isAdmin ? () => openDebug('process') : undefined}
            defaultCollapsed={defaultOpenStep !== 2}
          >
            {/* Pending State - Locked if Step 1 not completed */}
            {recording.processing_status === 'pending' && recording.transcription_status !== 'completed' && (
              <div className="text-center py-8 space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Complete o <strong>Step 1 (Transcrição)</strong> primeiro
                </p>
              </div>
            )}

            {/* Pending State - Ready to process */}
            {recording.processing_status === 'pending' && recording.transcription_status === 'completed' && (
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Transcrição bruta pronta. Organize em tópicos para facilitar a análise.
                </p>
                <JumperButton
                  onClick={() => handleProcess()}
                  disabled={isProcessing || !transcript?.full_text}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Organizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Organizar em Tópicos
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Failed State */}
            {recording.processing_status === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive opacity-70" />
                <div className="space-y-2">
                  <p className="text-destructive font-medium">
                    Falha ao processar transcrição
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Use o ícone de debug acima para ver detalhes do erro
                    </p>
                  )}
                </div>
                <JumperButton
                  onClick={() => handleProcess()}
                  disabled={isProcessing || !transcript?.full_text}
                  variant="default"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Completed State */}
            {recording.processing_status === 'completed' && transcript?.processed_text && (
              <LogViewer content={transcript.processed_text} />
            )}
          </OptimizationStepCard>

          {/* Arrow Up - Fluxo de refinamento (Step 2 ← Step 1) */}
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="h-4 w-px bg-gradient-to-b from-border to-transparent" />
            <ChevronUp className="h-8 w-8 text-muted-foreground animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium">Organiza em</p>
          </div>

          {/* SEÇÃO 1: TRANSCRIÇÃO (BASE - Texto bruto) */}
          <OptimizationStepCard
            stepNumber={1}
            title="Transcrição"
            description="Áudio → Texto formatado"
            status={recording.transcription_status}
            onEdit={() => setTranscriptEditorModalOpen(true)}
            onCopy={handleCopyTranscript}
            isEditDisabled={recording.transcription_status !== 'completed'}
            onDebug={isAdmin ? () => openDebug('transcribe') : undefined}
            defaultCollapsed={defaultOpenStep !== 1}
          >
            {/* Audio Player */}
            {audioUrl && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            {/* Pending State */}
            {recording.transcription_status === 'pending' && (
              <div className="text-center py-8 space-y-4">
                <Mic className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Este áudio ainda não foi transcrito
                </p>
                <JumperButton onClick={() => handleTranscribe()} disabled={isTranscribing} size="lg">
                  {isTranscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Transcrever Áudio
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Completed State */}
            {recording.transcription_status === 'completed' && transcript && (
              <TranscriptViewer content={transcript.full_text} />
            )}
          </OptimizationStepCard>

          {/* Spacer arrow - Admin-only section */}
          {recording.analysis_status === 'completed' && isAdmin && context && (
            <div className="flex flex-col items-center gap-1 py-4">
              <p className="text-xs text-muted-foreground font-medium">Seção Admin</p>
              <ChevronDown className="h-8 w-8 text-amber-500/50 animate-bounce" />
              <div className="h-4 w-px bg-gradient-to-b from-transparent to-amber-500/20" />
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Modals */}
      <DebugModal
        open={debugModalOpen}
        onOpenChange={setDebugModalOpen}
        recordingId={recordingId!}
        step={debugStep}
      />

      <ShareOptimizationModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        recordingId={recordingId!}
        accountName={accountName}
        recordedAt={recording.recorded_at}
      />

      {extract && recordingId && (
        <ExtractEditorModal
          open={extractEditorModalOpen}
          onOpenChange={setExtractEditorModalOpen}
          recordingId={recordingId}
          currentText={extract.extract_text}
          onSave={handleSaveExtract}
          onRegenerate={handleGenerateExtract}
          hasUndo={!!extract.previous_version}
          onUndo={handleUndoExtract}
          editCount={extract.edit_count}
          lastEditedAt={extract.updated_at}
          isRegenerating={isGeneratingExtract}
        />
      )}

      {context && (
        <AIAnalysisImprovementsModal
          isOpen={aiAnalysisImprovementsModalOpen}
          onClose={() => setAiAnalysisImprovementsModalOpen(false)}
          recordingId={recordingId!}
          currentContext={context}
          onApply={handleApplyAnalysisImprovements}
          isAdmin={isAdmin}
          onDebug={() => openDebug('analyze')}
        />
      )}

      <AIImprovementsModal
        isOpen={aiImprovementsModalOpen}
        onClose={() => setAiImprovementsModalOpen(false)}
        recordingId={recordingId!}
        currentText={editedTranscript}
        whisperPrompt={originalWhisperPrompt}
        onApply={handleApplyAIImprovements}
        isAdmin={isAdmin}
        onDebug={() => {
          openDebug('improve_transcript');
        }}
      />

      <RetranscribeConfirmModal
        isOpen={retranscribeModalOpen}
        onClose={() => setRetranscribeModalOpen(false)}
        onConfirm={handleRetranscribe}
        isLoading={isRetranscribing}
      />

      {/* Enhancement Diff Modal - Shows AI changes with revert option */}
      {transcript?.original_text && transcript?.full_text && (
        <EnhancementDiffModal
          isOpen={enhancementDiffModalOpen}
          onClose={() => setEnhancementDiffModalOpen(false)}
          recordingId={recordingId!}
          originalText={transcript.original_text}
          enhancedText={transcript.full_text}
          onRevert={handleRevertToOriginal}
        />
      )}

      <AIProcessImprovementsModal
        isOpen={aiProcessImprovementsModalOpen}
        onClose={() => setAiProcessImprovementsModalOpen(false)}
        recordingId={recordingId!}
        currentText={editedProcessed}
        onApply={handleApplyProcessedImprovements}
        isAdmin={isAdmin}
        onDebug={() => {
          openDebug('improve_processed');
        }}
      />

      <ReprocessConfirmModal
        isOpen={reprocessModalOpen}
        onClose={() => setReprocessModalOpen(false)}
        onConfirm={handleReprocess}
        isProcessing={isReprocessing}
      />

      {/* Log Editor Modal (Step 2) */}
      {transcript && (
        <LogEditorModal
          open={logEditorModalOpen}
          onOpenChange={setLogEditorModalOpen}
          recordingId={recordingId!}
          currentText={editedProcessed}
          onSave={handleSaveProcessed}
          onAIImprove={() => {
            setLogEditorModalOpen(false);
            setAiProcessImprovementsModalOpen(true);
          }}
          onReprocess={() => {
            setLogEditorModalOpen(false);
            setReprocessModalOpen(true);
          }}
          onUndo={handleUndoProcessed}
          hasUndo={!!transcript.processed_previous_version}
          editCount={transcript.processed_edit_count || 0}
          lastEditedAt={transcript.processed_last_edited_at}
        />
      )}

      {/* Transcript Editor Modal (Step 1) */}
      {transcript && (
        <TranscriptEditorModal
          open={transcriptEditorModalOpen}
          onOpenChange={setTranscriptEditorModalOpen}
          recordingId={recordingId!}
          currentText={editedTranscript}
          originalText={transcript.original_text || ''}
          onSave={handleSaveTranscript}
          onAIImprove={() => {
            setTranscriptEditorModalOpen(false);
            setAiImprovementsModalOpen(true);
          }}
          onRetranscribe={() => {
            setTranscriptEditorModalOpen(false);
            setRetranscribeModalOpen(true);
          }}
          hasUndo={!!transcript.previous_version}
          onUndo={handleUndo}
          onViewEnhancement={() => {
            setEnhancementDiffModalOpen(true);
          }}
          editCount={transcript.edit_count || 0}
          lastEditedAt={transcript.last_edited_at}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Otimização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta otimização?
              <br />
              <br />
              <strong>Esta ação não pode ser desfeita.</strong> A gravação de áudio, transcrição, log e todos os dados relacionados serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOptimization}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </JumperBackground>
  );
}
