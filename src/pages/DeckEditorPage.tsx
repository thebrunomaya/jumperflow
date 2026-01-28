/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DeckEditorPage - Interactive 3-stage deck generation editor
 *
 * Implements Optimizations-style workflow:
 * Stage 1: Content Analysis (j_hub_deck_analyze)
 * Stage 2: Plan Review (auto-approved for now)
 * Stage 3: HTML Generation (j_hub_deck_generate)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { DeckEditorStepCard } from "@/components/decks/DeckEditorStepCard";
import { DeckShareModal } from "@/components/decks/DeckShareModal";
import {
  ChevronLeft,
  FileText,
  Search,
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  Maximize2,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type DeckStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Deck {
  id: string;
  title: string;
  type: string;
  template_id: string;
  brand_identity: string;
  markdown_source: string;
  generation_plan: any;
  html_output: string | null;
  file_url: string | null;
  analysis_status: DeckStatus;
  review_status: DeckStatus;
  generation_status: DeckStatus;
  created_at: string;
  updated_at: string;
  slug?: string | null;
  is_public?: boolean;
}

export default function DeckEditorPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Stage loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI states
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load deck data
  useEffect(() => {
    if (!deckId) return;
    loadDeck();

    // Poll for status updates every 3 seconds when stages are processing
    const interval = setInterval(() => {
      if (deck?.analysis_status === 'processing' || deck?.generation_status === 'processing') {
        loadDeck();
      }
    }, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadDeck and deck status checked inside interval
  }, [deckId]);

  const loadDeck = async () => {
    try {
      setIsLoadingData(true);

      const { data, error } = await supabase
        .from('j_hub_decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Deck not found');

      setDeck(data as Deck);

      // Determine which step should be open by default
      const defaultOpen = getDefaultOpenStep(data as Deck);
      if (openStep === null) {
        setOpenStep(defaultOpen);
      }

    } catch (error: any) {
      console.error('Error loading deck:', error);
      toast.error('Erro ao carregar deck: ' + error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Determine which step should be open by default (most-completed step)
  const getDefaultOpenStep = (deck: Deck): number => {
    if (deck.generation_status === 'completed') return 3;
    if (deck.review_status === 'completed' || deck.generation_status === 'processing') return 3;
    if (deck.analysis_status === 'completed') return 2;
    return 1;
  };

  // Detect if deck is stuck in processing (>10 minutes)
  const isStuckInProcessing = (status: DeckStatus, updatedAt: string): boolean => {
    if (status !== 'processing') return false;

    const updated = new Date(updatedAt);
    const now = new Date();
    const minutesSince = (now.getTime() - updated.getTime()) / 1000 / 60;

    return minutesSince > 10;
  };

  // Stage 1: Content Analysis
  const handleAnalyze = async () => {
    if (!deck) return;

    try {
      setIsAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('j_hub_deck_analyze', {
        body: {
          deck_id: deck.id,
          markdown_source: deck.markdown_source,
          deck_type: deck.type,
          template_id: deck.template_id,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      toast.success('Análise concluída! 🎉');
      await loadDeck(); // Reload to get updated plan

    } catch (error: any) {
      console.error('Error analyzing content:', error);
      toast.error('Erro na análise: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stage 2: Approve Plan
  const handleApprovePlan = async () => {
    if (!deck) return;

    try {
      setIsApproving(true);

      const { error } = await supabase
        .from('j_hub_decks')
        .update({
          review_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', deck.id);

      if (error) throw error;

      toast.success('Plano aprovado! ✅');
      await loadDeck(); // Reload to update status

    } catch (error: any) {
      console.error('Error approving plan:', error);
      toast.error('Erro ao aprovar: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Stage 3: HTML Generation
  const handleGenerate = async (forceRetry = false) => {
    if (!deck) return;

    try {
      setIsGenerating(true);

      // If stuck and forceRetry is true, first reset the status
      if (forceRetry && deck.generation_status === 'processing') {
        toast.info('Resetando status travado...');
        await supabase
          .from('j_hub_decks')
          .update({ generation_status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', deck.id);

        await loadDeck(); // Reload after reset
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit for DB update
      }

      const { data, error } = await supabase.functions.invoke('j_hub_deck_generate', {
        body: {
          deck_id: deck.id,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      toast.success('Deck gerado com sucesso! 🎉');
      await loadDeck(); // Reload to get file_url

    } catch (error: any) {
      console.error('Error generating deck:', error);
      toast.error('Erro na geração: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Fullscreen (opens preview page in new window)
  const handleFullscreen = () => {
    window.open(`/decks/${deckId}/preview`, '_blank', 'width=1920,height=1080');
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deck) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o deck "${deck.title}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('j_hub_decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      toast.success('Deck excluído com sucesso');
      navigate('/decks');
    } catch (error: any) {
      console.error('Error deleting deck:', error);
      toast.error('Erro ao excluir deck: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center z-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-jumper-primary" />
          <p className="text-gray-600">Carregando deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center z-10">
          <p className="text-gray-600">Deck não encontrado</p>
          <JumperButton onClick={() => navigate('/decks')} className="mt-4">
            Voltar para Decks
          </JumperButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <JumperButton
            onClick={() => navigate('/decks')}
            variant="ghost"
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para Decks
          </JumperButton>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{deck.title}</h1>
              <div className="flex gap-2">
                <Badge variant="outline">{deck.type}</Badge>
                <Badge variant="outline">{deck.brand_identity}</Badge>
                <Badge variant="outline">{deck.template_id}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Stage Editor (Reverse Display: Stage 3 → 2 → 1) */}
        <div className="max-w-4xl mx-auto space-y-4">

          {/* STAGE 3: DECK PREVIEW (Top - Most Refined) */}
          <DeckEditorStepCard
            step={3}
            title="Deck Preview"
            subtitle="Apresentação final gerada"
            icon={Sparkles}
            status={deck.generation_status}
            isOpen={openStep === 3}
            onToggle={() => setOpenStep(openStep === 3 ? null : 3)}
            isLocked={deck.review_status !== 'completed'}
          >
            {deck.generation_status === 'completed' && (deck.html_output || deck.file_url) ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {deck.html_output ? (
                    <iframe
                      srcDoc={deck.html_output}
                      className="w-full h-full"
                      title="Deck Preview"
                    />
                  ) : deck.file_url ? (
                    <iframe
                      src={deck.file_url}
                      className="w-full h-full"
                      title="Deck Preview"
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Primary Actions */}
                  <JumperButton
                    onClick={handleFullscreen}
                    variant="outline"
                    size="sm"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Tela Cheia
                  </JumperButton>
                  <JumperButton
                    onClick={() => setIsShareModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </JumperButton>
                  <JumperButton
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = deck.file_url!;
                      a.download = `${deck.title}.html`;
                      a.click();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download HTML
                  </JumperButton>

                  {/* Secondary Actions */}
                  <JumperButton
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Regerar
                  </JumperButton>

                  {/* Danger Zone */}
                  <JumperButton
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir
                  </JumperButton>
                </div>
              </div>
            ) : deck.generation_status === 'processing' ? (
              isStuckInProcessing(deck.generation_status, deck.updated_at) ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                    <p className="text-yellow-800 font-medium mb-2">⚠️ Geração travada detectada</p>
                    <p className="text-sm text-yellow-700 mb-4">
                      A geração está em processamento há mais de 10 minutos.
                      Provavelmente houve um timeout. Clique abaixo para tentar novamente.
                    </p>
                    <JumperButton
                      onClick={() => handleGenerate(true)}
                      disabled={isGenerating}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Forçar Nova Tentativa
                    </JumperButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-jumper-primary" />
                  <p className="text-gray-600">Gerando apresentação...</p>
                  <p className="text-sm text-gray-500 mt-2">Isso pode levar 2-3 minutos</p>
                </div>
              )
            ) : deck.generation_status === 'failed' ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Geração falhou. Tente novamente.</p>
                <JumperButton onClick={handleGenerate} disabled={isGenerating}>
                  Tentar Novamente
                </JumperButton>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Clique no botão abaixo para gerar a apresentação HTML</p>
                <JumperButton onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Gerar Apresentação
                </JumperButton>
              </div>
            )}
          </DeckEditorStepCard>

          {/* STAGE 2: SLIDE PLAN (Middle - Structured) */}
          <DeckEditorStepCard
            step={2}
            title="Slide Plan"
            subtitle="Estrutura da apresentação"
            icon={FileText}
            status={deck.review_status}
            isOpen={openStep === 2}
            onToggle={() => setOpenStep(openStep === 2 ? null : 2)}
            isLocked={deck.analysis_status !== 'completed'}
          >
            {deck.generation_plan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total de Slides</p>
                    <p className="text-2xl font-bold">{deck.generation_plan.total_slides}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pattern Diversity</p>
                    <p className="text-2xl font-bold">
                      {(deck.generation_plan.pattern_diversity_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {deck.generation_plan.slides.map((slide: any) => (
                    <div key={slide.slide_number} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            Slide {slide.slide_number}: {slide.section_title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{slide.content_summary}</p>
                        </div>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {slide.recommended_pattern}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Approve Plan Button */}
                {deck.review_status === 'pending' && (
                  <div className="pt-4 border-t">
                    <JumperButton
                      onClick={handleApprovePlan}
                      disabled={isApproving}
                      className="w-full"
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Aprovar Plano e Prosseguir
                    </JumperButton>
                  </div>
                )}

                {/* Already Approved Message */}
                {deck.review_status === 'completed' && (
                  <div className="pt-4 border-t">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-green-700 font-medium">✅ Plano aprovado!</p>
                      <p className="text-sm text-green-600 mt-1">Stage 3 desbloqueado. Role para cima para gerar a apresentação.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                Aguardando Stage 1 (Content Analysis)
              </p>
            )}
          </DeckEditorStepCard>

          {/* STAGE 1: CONTENT ANALYSIS (Bottom - Raw Input) */}
          <DeckEditorStepCard
            step={1}
            title="Content Analysis"
            subtitle="Análise do markdown"
            icon={Search}
            status={deck.analysis_status}
            isOpen={openStep === 1}
            onToggle={() => setOpenStep(openStep === 1 ? null : 1)}
            isLocked={false}
          >
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Markdown Source</p>
                <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {deck.markdown_source.substring(0, 500)}...
                </pre>
              </div>

              {deck.analysis_status === 'completed' ? (
                <div className="flex gap-2">
                  <JumperButton onClick={handleAnalyze} disabled={isAnalyzing} variant="outline" size="sm">
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Reanalisar
                  </JumperButton>
                </div>
              ) : deck.analysis_status === 'processing' ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-jumper-primary" />
                  <p className="text-sm text-gray-600">Analisando conteúdo...</p>
                </div>
              ) : deck.analysis_status === 'failed' ? (
                <div className="text-center py-4">
                  <p className="text-red-600 mb-2 text-sm">Análise falhou</p>
                  <JumperButton onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
                    Tentar Novamente
                  </JumperButton>
                </div>
              ) : (
                <JumperButton onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Analisar Conteúdo
                </JumperButton>
              )}
            </div>
          </DeckEditorStepCard>

        </div>
      </div>

      {/* Share Modal */}
      {deck && (
        <DeckShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          deckId={deck.id}
          deckTitle={deck.title}
          currentSlug={deck.slug}
          isPublic={deck.is_public}
        />
      )}
    </div>
  );
}
