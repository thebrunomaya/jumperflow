/**
 * OptimizationDrawer - Detailed view of a single optimization recording
 * Opens as a side drawer with full details
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Clock,
  FileText,
  Brain,
  Copy,
  CheckCircle2,
  User,
  Download,
  Edit,
  RotateCw,
  Sparkles,
  Trash2,
  Save,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
} from "@/types/optimization";
import { OptimizationContextCard } from "@/components/OptimizationContextCard";
import { exportOptimizationToPDF } from "@/utils/pdfExport";
import { generateAnalysisMarkdown } from "@/utils/markdownExport";
import { TranscriptionEditorModal } from "./TranscriptionEditorModal";
import { UnifiedOptimizationEditorModal } from "./UnifiedOptimizationEditorModal";
import { MarkdownPreviewModal } from "./MarkdownPreviewModal";
import { ShareOptimizationModal } from "./ShareOptimizationModal";

interface OptimizationDrawerProps {
  recording: OptimizationRecordingRow | null;
  audioUrl: string | null;
  transcript: OptimizationTranscriptRow | null;
  context: OptimizationContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscribe: () => void;
  onAnalyze: () => void;
  onRefresh: () => void;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  accountName?: string;
  onDelete?: () => void;
}

// Extracted Transcription Section Component with Tabs
function TranscriptionSection({
  transcript,
  recordingId,
  onCopy,
  onRefresh,
}: {
  transcript: OptimizationTranscriptRow;
  recordingId: string;
  onCopy: () => void;
  onRefresh: () => void;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<'raw' | 'processed'>('processed');

  const handleEdit = (type: 'raw' | 'processed') => {
    setEditingType(type);
    setEditModalOpen(true);
  };

  const handleExportTranscription = () => {
    const textToExport = transcript.processed_text || transcript.full_text;
    const type = transcript.processed_text ? 'processada' : 'bruta';

    // Create a simple text file download
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcricao-${type}-${recordingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Transcrição exportada!');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Transcrição Completa
            </h3>
            {transcript.revised_at ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                ✏️ Revisado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Original IA
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <JumperButton
              onClick={() => handleEdit(transcript.processed_text ? 'processed' : 'raw')}
              variant="ghost"
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </JumperButton>
            <JumperButton
              onClick={onCopy}
              variant="ghost"
              size="sm"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </JumperButton>
            <JumperButton
              onClick={handleExportTranscription}
              variant="ghost"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </JumperButton>
          </div>
        </div>
        {transcript.revised_at && (
          <p className="text-xs text-muted-foreground">
            Transcrição revisada em {new Date(transcript.revised_at).toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      <Tabs defaultValue={transcript.processed_text ? "processed" : "raw"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processed" disabled={!transcript.processed_text}>
            Processada
          </TabsTrigger>
          <TabsTrigger value="raw">
            Bruta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processed">
          {transcript.processed_text ? (
            <Textarea
              value={transcript.processed_text}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              placeholder="Transcrição organizada em tópicos..."
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma transcrição processada disponível</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="raw">
          <Textarea
            value={transcript.full_text}
            readOnly
            className="min-h-[400px] font-mono text-sm"
            placeholder="Transcrição bruta do Whisper..."
          />
          {transcript.confidence_score && (
            <p className="text-xs text-muted-foreground mt-2">
              Confiança: {(Number(transcript.confidence_score) * 100).toFixed(0)}%
            </p>
          )}
        </TabsContent>
      </Tabs>

      <TranscriptionEditorModal
        recordingId={recordingId}
        transcriptType={editingType}
        initialText={editingType === 'raw' ? transcript.full_text : (transcript.processed_text || '')}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={onRefresh}
      />
    </div>
  );
}

// Extracted Analysis Section Component
function AnalysisSection({
  context,
  recordingId,
  accountName,
  recordedBy,
  recordedAt,
  durationSeconds,
  onRefresh,
  onExportPDF,
  onShare,
}: {
  context: OptimizationContext;
  recordingId: string;
  accountName: string;
  recordedBy: string;
  recordedAt: Date;
  durationSeconds?: number;
  onRefresh: () => void;
  onExportPDF: () => void;
  onShare: () => void;
}) {
  const [unifiedEditorOpen, setUnifiedEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [markdown, setMarkdown] = useState("");

  // Check if analysis was revised
  const wasRevised = context.confidence_level === "revised" || !!(context as any).revised_at;

  const handleCopyAnalysis = () => {
    const md = generateAnalysisMarkdown(
      context,
      accountName,
      recordedBy,
      recordedAt,
      durationSeconds
    );
    setMarkdown(md);
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Extrato de Otimização
              </h3>
              {wasRevised ? (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  ✏️ Revisado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {context.confidence_level === 'high' && 'Alta confiança'}
                  {context.confidence_level === 'medium' && 'Média confiança'}
                  {context.confidence_level === 'low' && 'Baixa confiança'}
                  {!context.confidence_level && 'Média confiança'}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <JumperButton
                onClick={() => setUnifiedEditorOpen(true)}
                variant="ghost"
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </JumperButton>
              <JumperButton
                onClick={handleCopyAnalysis}
                variant="ghost"
                size="sm"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </JumperButton>
              <JumperButton
                onClick={onShare}
                variant="ghost"
                size="sm"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </JumperButton>
              <JumperButton
                onClick={onExportPDF}
                variant="ghost"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </JumperButton>
            </div>
          </div>
          {wasRevised && (context as any).revised_at && (
            <p className="text-xs text-muted-foreground">
              Extrato revisado em {new Date((context as any).revised_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <OptimizationContextCard context={context} />
      </div>

      <UnifiedOptimizationEditorModal
        isOpen={unifiedEditorOpen}
        onClose={() => setUnifiedEditorOpen(false)}
        context={context}
        recordingId={recordingId}
        onSaveSuccess={onRefresh}
      />

      <MarkdownPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        markdown={markdown}
        title="Preview do Extrato de Otimização"
      />
    </>
  );
}

export function OptimizationDrawer({
  recording,
  audioUrl,
  transcript,
  context,
  open,
  onOpenChange,
  onTranscribe,
  onAnalyze,
  onRefresh,
  isTranscribing,
  isAnalyzing,
  accountName = "Conta",
  onDelete,
}: OptimizationDrawerProps) {
  // Hook must be called before any conditional returns
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  if (!recording) return null;

  const handleDelete = async () => {
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
        .eq('id', recording.id);

      if (deleteError) throw deleteError;

      toast.success('Gravação apagada com sucesso!');
      
      // Close drawer
      onOpenChange(false);
      
      // Refresh recordings list
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao apagar gravação');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pending: { variant: "secondary", label: "Pendente" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "outline", label: "Concluído" },
      failed: { variant: "destructive", label: "Falha" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCopyTranscript = () => {
    if (transcript?.full_text) {
      navigator.clipboard.writeText(transcript.full_text);
      toast.success("Transcrição copiada!");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExportPDF = () => {
    exportOptimizationToPDF(recording, accountName, transcript, context);
    toast.success("PDF gerado com sucesso!");
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[50vw] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">Detalhes da Gravação</SheetTitle>
              <SheetDescription>
                {format(new Date(recording.recorded_at), "PPP 'às' HH:mm", { locale: ptBR })}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(recording.transcription_status)}
              {getStatusBadge(recording.analysis_status)}
            </div>
          </div>
          
          <div className="flex justify-start pt-2">
            <JumperButton
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar Gravação
            </JumperButton>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            {/* Recording Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Gravado por: <strong className="text-foreground">{recording.recorded_by}</strong></span>
              </div>
              {recording.duration_seconds != null && recording.duration_seconds > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duração: <strong className="text-foreground">{formatDuration(recording.duration_seconds)}</strong></span>
                </div>
              )}
            </div>

            <Separator />

            {/* Audio Player */}
            {audioUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Gravação de Áudio
                </h3>
                <div className="p-4 bg-muted rounded-lg border">
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              </div>
            )}

            {!audioUrl && recording.audio_file_path && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Carregando áudio...
              </div>
            )}

            <Separator />

            {/* Transcription Section */}
            {recording.transcription_status === "pending" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Transcrição
                </h3>
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta gravação ainda não foi transcrita
                  </p>
                  <JumperButton
                    onClick={onTranscribe}
                    disabled={isTranscribing}
                    variant="primary"
                    size="sm"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Transcrever Agora
                      </>
                    )}
                  </JumperButton>
                </div>
              </div>
            )}

            {recording.transcription_status === "completed" && transcript && (
              <>
                <TranscriptionSection
                  transcript={transcript}
                  recordingId={recording.id}
                  onCopy={handleCopyTranscript}
                  onRefresh={onRefresh}
                />

                {/* Extrato de Otimização - Pendente */}
                {recording.analysis_status === "pending" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          Extrato de Otimização
                        </h3>
                        <Badge variant="secondary">Não gerado</Badge>
                      </div>
                      
                      <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                          O extrato estruturado ainda não foi gerado. 
                          Clique em "Analisar" para extrair ações, métricas e estratégias.
                        </p>
                        <JumperButton
                          onClick={onAnalyze}
                          disabled={isAnalyzing}
                          variant="primary"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analisando com IA...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Analisar com IA
                            </>
                          )}
                        </JumperButton>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {recording.transcription_status === "completed" && !transcript && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-destructive" />
                  Transcrição - Erro de Consistência
                </h3>
                <div className="p-6 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive mb-4">
                    ⚠️ O status indica "concluído" mas a transcrição não foi encontrada no banco de dados. 
                    Isso pode indicar um problema de sincronização.
                  </p>
                  <JumperButton
                    onClick={onTranscribe}
                    disabled={isTranscribing}
                    variant="critical"
                    size="sm"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Tentar Transcrever Novamente
                      </>
                    )}
                  </JumperButton>
                </div>
              </div>
            )}

            {/* AI Analysis Section */}
            {recording.analysis_status === "completed" && context && (
              <>
                <Separator />
                <AnalysisSection
                  context={context}
                  recordingId={recording.id}
                  accountName={accountName}
                  recordedBy={recording.recorded_by}
                  recordedAt={new Date(recording.recorded_at)}
                  durationSeconds={recording.duration_seconds}
                  onRefresh={onRefresh}
                  onExportPDF={handleExportPDF}
                  onShare={handleShare}
                />
              </>
            )}

            {recording.analysis_status === "completed" && !context && transcript && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-destructive" />
                    Análise com IA - Erro de Consistência
                  </h3>
                  <div className="p-6 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                    <p className="text-sm text-destructive mb-4">
                      ⚠️ O status indica "concluído" mas o contexto de análise não foi encontrado no banco de dados. 
                      Isso pode indicar um problema de sincronização.
                    </p>
                    <JumperButton
                      onClick={onAnalyze}
                      disabled={isAnalyzing}
                      variant="critical"
                      size="sm"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Tentar Analisar Novamente
                        </>
                      )}
                    </JumperButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Share Optimization Modal */}
      <ShareOptimizationModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        recordingId={recording.id}
        accountName={accountName}
        recordedAt={recording.recorded_at}
      />
    </Sheet>
  );
}
