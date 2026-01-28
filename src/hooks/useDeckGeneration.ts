import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeckGenerationParams {
  title: string;
  markdown_source: string;
  type: 'report' | 'plan' | 'pitch';
  brand_identity: 'jumper' | 'koko';
  template_id: string;
  account_id?: string;
}

export interface DeckGenerationResult {
  success: boolean;
  deck_id?: string;
  html_url?: string;
  slide_count?: number;
  error?: string;
}

/**
 * Hook to generate a deck by calling j_hub_deck_generate Edge Function
 * Manages loading state, error handling, and progress notifications
 */
export const useDeckGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateDeck = async (params: DeckGenerationParams): Promise<DeckGenerationResult> => {
    try {
      setIsGenerating(true);
      setProgress(10);
      setError(null);

      // Validate params
      if (!params.title || !params.markdown_source || !params.type || !params.brand_identity || !params.template_id) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      if (params.markdown_source.length < 100) {
        throw new Error('O conteúdo markdown deve ter pelo menos 100 caracteres');
      }

      setProgress(20);
      toast.info('Gerando deck...', {
        description: 'Processando template e design system',
        duration: 3000,
      });

      // Call Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('j_hub_deck_generate', {
        body: {
          title: params.title,
          markdown_source: params.markdown_source,
          type: params.type,
          brand_identity: params.brand_identity,
          template_id: params.template_id,
          account_id: params.account_id || null,
        },
      });

      setProgress(80);

      if (invokeError) {
        console.error('Edge Function error:', invokeError);
        throw new Error(invokeError.message || 'Falha ao gerar deck');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }

      setProgress(100);

      toast.success('Deck gerado com sucesso!', {
        description: `${data.slide_count || 'Vários'} slides criados. Redirecionando para o editor...`,
        duration: 3000,
      });

      return {
        success: true,
        deck_id: data.deck_id,
        html_url: data.html_url,
        slide_count: data.slide_count,
      };

    } catch (err) {
      console.error('useDeckGeneration error:', err);
      const errorMessage = err?.message || 'Falha ao gerar deck';
      setError(errorMessage);

      toast.error('Erro ao gerar deck', {
        description: errorMessage,
        duration: 5000,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsGenerating(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    generateDeck,
    isGenerating,
    progress,
    error,
  };
};
