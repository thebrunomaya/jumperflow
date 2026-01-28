/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OptimizationRecorder - Enhanced with Context & Objectives
 * 
 * Allows managers to record optimization audio narrations with:
 * - Account context (editable for this recording only)
 * - Platform selection (Meta/Google)
 * - Objective selection with custom prompts
 */

import { useState, useEffect, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { JumperButton } from "@/components/ui/jumper-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, Upload, Loader2, AlertCircle, Edit, FileAudio, Download } from "lucide-react";
import { toast } from "sonner";
import { ContextEditor } from "./optimization/ContextEditor";
import { PromptEditorModal } from "./optimization/PromptEditorModal";
import { PlatformSelector } from "./optimization/PlatformSelector";
import { ObjectiveCheckboxes } from "./optimization/ObjectiveCheckboxes";
import { ProcessingOverlay, ProcessingStep } from "./optimization/ProcessingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OptimizationRecorderProps {
  accountId: string;  // UUID reference to j_hub_notion_db_accounts(id)
  accountName: string;
  accountContext?: string;
  notionObjectives?: string[];
  availableObjectives?: string[];
  dateRange?: { start: Date; end: Date }; // NEW: Period being analyzed
  onUploadComplete?: () => void;
}

export function OptimizationRecorder({
  accountId,
  accountName,
  accountContext = '',
  notionObjectives = [],
  availableObjectives = [],
  dateRange, // NEW: Period being analyzed
  onUploadComplete
}: OptimizationRecorderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Context & Optimization state
  const [editedContext, setEditedContext] = useState(accountContext);
  const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(notionObjectives);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    objective?: string;
  }>({ isOpen: false });

  // Processing overlay state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update edited context when account changes
  useEffect(() => {
    setEditedContext(accountContext);
    setSelectedObjectives(notionObjectives);
  }, [accountId, accountContext, notionObjectives]);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    askPermissionOnMount: false,
  });

  // Track recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "recording") {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const canStartRecording = () => {
    if (!accountId) {
      toast.error("Selecione uma conta");
      return false;
    }
    if (selectedObjectives.length === 0) {
      toast.error("Selecione pelo menos um objetivo");
      return false;
    }
    return true;
  };

  const handleStartRecording = () => {
    if (canStartRecording()) {
      // Clear any uploaded file when starting recording
      setUploadedFile(null);
      if (uploadedFileUrl) {
        URL.revokeObjectURL(uploadedFileUrl);
        setUploadedFileUrl(null);
      }
      startRecording();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (audio only)
    if (!file.type.startsWith('audio/')) {
      toast.error("Por favor, selecione um arquivo de áudio válido");
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Tamanho máximo: 50MB");
      return;
    }

    // Clear any existing recording
    if (mediaBlobUrl) {
      clearBlobUrl();
      setRecordingDuration(0);
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedFileUrl(url);
    toast.success(`Arquivo selecionado: ${file.name}`);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAudio = () => {
    const url = mediaBlobUrl || uploadedFileUrl;
    if (!url) {
      toast.error("Nenhum áudio disponível para download");
      return;
    }

    // Create download link
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const accountNameSlug = accountName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const fileName = `otimizacao-${accountNameSlug}-${timestamp}.webm`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("✅ Áudio salvo em Downloads! Você pode enviá-lo depois usando 'Enviar Arquivo'.", {
      duration: 6000
    });
  };

  async function handleUpload() {
    if ((!mediaBlobUrl && !uploadedFile) || !accountId || !user?.email) {
      toast.error("Selecione uma conta e grave ou envie um áudio primeiro");
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setCurrentStep('upload');
    setProcessingError(null);

    let insertedRecordingId: string | null = null;

    try {
      // 1. Upload audio
      let blob: Blob;
      let contentType: string;
      let fileExtension: string;

      if (uploadedFile) {
        // Use uploaded file
        blob = uploadedFile;
        contentType = uploadedFile.type;
        fileExtension = uploadedFile.name.split('.').pop() || 'audio';
      } else {
        // Use recorded audio
        const response = await fetch(mediaBlobUrl!);
        blob = await response.blob();
        contentType = "audio/webm";
        fileExtension = "webm";
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${accountId}/${timestamp}.${fileExtension}`;
      const filePath = `optimizations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("optimizations")
        .upload(filePath, blob, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Insert recording
      const { data: recording, error: dbError } = await supabase
        .from("j_hub_optimization_recordings")
        .insert({
          account_id: accountId,  // UUID reference to j_hub_notion_db_accounts(id)
          recorded_by: user.email,
          audio_file_path: filePath,
          duration_seconds: recordingDuration,
          transcription_status: "pending",
          analysis_status: "pending",
          override_context: editedContext !== accountContext ? editedContext : null,
          platform,
          selected_objectives: selectedObjectives,
          date_range_start: dateRange?.start?.toISOString() || null,
          date_range_end: dateRange?.end?.toISOString() || null,
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from("optimizations").remove([filePath]);
        throw dbError;
      }

      insertedRecordingId = recording.id;
      setCurrentRecordingId(recording.id);
      
      // 3. AUTO-TRIGGER TRANSCRIPTION
      setCurrentStep('transcribe');

      const { error: transcribeError } = await supabase.functions.invoke(
        "j_hub_optimization_transcribe",
        { body: { recording_id: recording.id } }
      );

      if (transcribeError) throw new Error(`Transcrição falhou: ${transcribeError.message}`);

      // 4. POLL FOR TRANSCRIPTION COMPLETION
      const maxAttempts = 60; // 60 seconds max
      let attempts = 0;
      let transcriptionComplete = false;

      while (attempts < maxAttempts && !transcriptionComplete) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: statusCheck } = await supabase
          .from("j_hub_optimization_recordings")
          .select("transcription_status")
          .eq("id", recording.id)
          .single();

        if (statusCheck?.transcription_status === "completed") {
          transcriptionComplete = true;
        } else if (statusCheck?.transcription_status === "failed") {
          throw new Error("Transcrição falhou - verifique os logs");
        }

        attempts++;
      }

      if (!transcriptionComplete) {
        console.warn("Timeout na transcrição");
      }

      // 5. SUCCESS!
      setCurrentStep('complete');
      toast.success("✅ Transcrição concluída! Clique na gravação para continuar o processamento");
      
      clearBlobUrl();
      handleClearFile();
      setRecordingDuration(0);
      setEditedContext(accountContext);
      
      setTimeout(() => {
        setIsProcessing(false);
        onUploadComplete?.();
      }, 2000);

    } catch (error: any) {
      console.error("Processing error:", error);
      setCurrentStep('error');
      const errorMessage = error.message || "Erro desconhecido no processamento";
      setProcessingError(errorMessage);

      // Determine if error is transient or permanent
      const isTransientError = errorMessage.includes('temporarily unavailable') ||
                              errorMessage.includes('CDN error') ||
                              errorMessage.includes('after 3 attempts') ||
                              errorMessage.includes('502') ||
                              errorMessage.includes('503') ||
                              errorMessage.includes('504');

      if (isTransientError) {
        // TRANSIENT ERROR: Keep recording for retry later
        toast.error(
          "OpenAI API está temporariamente indisponível. A gravação foi salva e você pode tentar novamente mais tarde.",
          { duration: 6000 }
        );
        console.log(`⚠️ [RECORDER] Transient error - recording preserved: ${insertedRecordingId}`);
      } else {
        // PERMANENT ERROR: Delete recording (file invalid, auth failed, etc)
        if (insertedRecordingId) {
          await supabase
            .from("j_hub_optimization_recordings")
            .delete()
            .eq("id", insertedRecordingId);
          console.log(`❌ [RECORDER] Permanent error - recording deleted: ${insertedRecordingId}`);
        }

        // Auto-download audio on permanent failure (e.g., network error during upload)
        // This prevents data loss - user can retry later using "Upload File" tab
        if (mediaBlobUrl || uploadedFileUrl) {
          try {
            handleDownloadAudio();
            toast.error(
              `❌ Erro no upload! Salvamos o áudio em Downloads.\n` +
              `Você pode enviá-lo depois usando a aba 'Enviar Arquivo'.\n\n` +
              `Erro: ${errorMessage}`,
              { duration: 10000 }
            );
          } catch (downloadError) {
            console.error('Failed to auto-download audio:', downloadError);
            toast.error(`Erro permanente: ${errorMessage}`);
          }
        } else {
          toast.error(`Erro permanente: ${errorMessage}`);
        }
      }

    } finally {
      setIsUploading(false);
    }
  }


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Nova Gravação de Otimização
        </CardTitle>
        <CardDescription>
          Conta: <strong>{accountName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Account Information */}
        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">📝 Informações da Conta</h3>
            {editedContext !== accountContext && (
              <span className="text-xs text-primary font-medium">(Editado)</span>
            )}
          </div>

          <div className="bg-muted/30 p-3 rounded-md text-sm max-h-32 overflow-y-auto border">
            {editedContext || 'Nenhum contexto disponível para esta conta'}
          </div>

          <JumperButton
            variant="secondary"
            size="sm"
            onClick={() => setIsContextEditorOpen(true)}
            className="w-full"
          >
            <Edit className="h-3 w-3 mr-2" />
            Editar para Esta Gravação
          </JumperButton>
        </div>

        {/* Section 2: Recording Configuration */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">🎯 Configuração da Otimização</h3>

          <PlatformSelector
            value={platform}
            onChange={setPlatform}
            onEditPrompt={() => setPromptModalState({ isOpen: true })}
          />

          <ObjectiveCheckboxes
            availableObjectives={availableObjectives}
            selectedObjectives={selectedObjectives}
            notionObjectives={notionObjectives}
            onChange={setSelectedObjectives}
            onEditPrompt={(objective) => setPromptModalState({ isOpen: true, objective })}
          />
        </div>

        {/* Recording/Upload Controls */}
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record" className="gap-2">
              <Mic className="h-4 w-4" />
              Gravar Áudio
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <FileAudio className="h-4 w-4" />
              Enviar Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 mt-4">
            {status === "idle" && (
              <div className="flex justify-center py-8">
                <button
                  onClick={handleStartRecording}
                  className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  aria-label="Iniciar gravação"
                >
                  <Mic className="h-10 w-10 text-white" />
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-75" />
                </button>
              </div>
            )}

            {status === "recording" && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8 gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                          <Mic className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-destructive/30 animate-ping" />
                  </div>
                  
                  <div className="text-center">
                    <div className="font-mono text-4xl font-bold tabular-nums">
                      {formatDuration(recordingDuration)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Gravando...</p>
                  </div>
                </div>

                <JumperButton
                  onClick={stopRecording}
                  variant="critical"
                  className="w-full"
                  size="lg"
                >
                  <Square className="mr-2 h-4 w-4 fill-current" />
                  Parar Gravação
                </JumperButton>
              </div>
            )}

            {status === "stopped" && mediaBlobUrl && (
              <div className="space-y-4">
                <Alert className="border-success/50 bg-success/5">
                  <AlertCircle className="h-4 w-4 text-success" />
                  <AlertDescription>
                    ✓ Gravação concluída: {formatDuration(recordingDuration)}
                  </AlertDescription>
                </Alert>

                <div className="p-4 border rounded-lg">
                  <audio controls src={mediaBlobUrl} className="w-full" />
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <JumperButton
                      onClick={handleUpload}
                      disabled={isUploading}
                      variant="primary"
                      className="flex-1"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Gravação
                        </>
                      )}
                    </JumperButton>

                    <JumperButton
                      onClick={() => {
                        clearBlobUrl();
                        setRecordingDuration(0);
                      }}
                      variant="ghost"
                      disabled={isUploading}
                      size="lg"
                    >
                      Cancelar
                    </JumperButton>
                  </div>

                  <JumperButton
                    onClick={handleDownloadAudio}
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={isUploading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Localmente
                  </JumperButton>
                </div>
              </div>
            )}

            {status === "acquiring_media" && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Aguardando permissão do microfone...
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="audio-file-upload"
              />
              
              {!uploadedFile ? (
                <label
                  htmlFor="audio-file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileAudio className="h-12 w-12 text-primary/50 mb-3" />
                    <p className="mb-2 text-sm font-medium">
                      Clique para selecionar um arquivo de áudio
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, M4A, WEBM ou outros formatos (máx. 50MB)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-success/50 bg-success/5">
                    <AlertCircle className="h-4 w-4 text-success" />
                    <AlertDescription>
                      ✓ Arquivo selecionado: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>

                  {uploadedFileUrl && (
                    <div className="p-4 border rounded-lg">
                      <audio controls src={uploadedFileUrl} className="w-full" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <JumperButton
                        onClick={handleUpload}
                        disabled={isUploading}
                        variant="primary"
                        className="flex-1"
                        size="lg"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar Arquivo
                          </>
                        )}
                      </JumperButton>

                      <JumperButton
                        onClick={handleClearFile}
                        variant="ghost"
                        disabled={isUploading}
                        size="lg"
                      >
                        Cancelar
                      </JumperButton>
                    </div>

                    <JumperButton
                      onClick={handleDownloadAudio}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={isUploading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Localmente
                    </JumperButton>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Processing Overlay */}
      <ProcessingOverlay
        isOpen={isProcessing}
        currentStep={currentStep}
        error={processingError}
        onRetry={handleUpload}
        onClose={() => {
          setIsProcessing(false);
          setProcessingError(null);
          setCurrentRecordingId(null);
        }}
      />

      {/* Modals */}
      <ContextEditor
        isOpen={isContextEditorOpen}
        onClose={() => setIsContextEditorOpen(false)}
        originalContext={accountContext}
        currentContext={editedContext}
        onSave={setEditedContext}
      />

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState({ isOpen: false })}
        platform={platform}
        objective={promptModalState.objective || selectedObjectives[0] || 'Vendas'}
        accountName={accountName}
        accountContext={editedContext}
      />
    </Card>
  );
}
