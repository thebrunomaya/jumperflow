/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SharedOptimization Page
 * Public page for viewing shared optimization extracts
 * Access via unique slug link
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { JumperButton } from '@/components/ui/jumper-button';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OptimizationContextCard } from '@/components/OptimizationContextCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Lock,
  Loader2,
  Calendar,
  User,
  FileText,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface OptimizationData {
  recording: {
    id: string;
    account_name: string;
    recorded_at: string;
    recorded_by: string;
    objectives: string[];
    platforms: string[];
  };
  context: {
    summary: string;
    actions_taken: any[];
    metrics_mentioned: Record<string, any>;
    strategy: any;
    timeline: any;
    confidence_level: string;
  } | null;
}

export default function SharedOptimization() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<OptimizationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptimization = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        // Make direct fetch to Edge Function (public, no auth required)
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/j_hub_optimization_view_shared`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slug: slug,
            }),
          }
        );

        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          console.error('Invalid response type:', contentType);
          throw new Error('Resposta inválida do servidor');
        }

        const text = await response.text();
        if (!text) {
          console.error('Empty response from server');
          throw new Error('Resposta vazia do servidor');
        }

        const result = JSON.parse(text);

        // Handle error responses
        if (!response.ok || result?.error) {
          const errorMsg = result?.error || '';

          if (errorMsg.includes('not found') || response.status === 404) {
            setError('Link não encontrado ou desativado');
            toast.error('Link não encontrado');
          } else if (errorMsg.includes('expired') || response.status === 403) {
            setError('Este link expirou');
            toast.error('Link expirado');
          } else {
            throw new Error(errorMsg || 'Erro ao carregar otimização');
          }
          return;
        }

        // Load successful
        setData(result);
      } catch (error: any) {
        console.error('Error loading optimization:', error);
        setError(error.message || 'Erro ao acessar otimização');
        toast.error('Erro ao carregar otimização');
      } finally {
        setIsLoading(false);
      }
    };

    loadOptimization();
  }, [slug]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O link de compartilhamento está incompleto ou inválido.
            </p>
            <JumperButton onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar ao Início
            </JumperButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <JumperBackground>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <JumperLogo variant="full" className="h-12 mb-8" />
          <Loader2 className="h-8 w-8 animate-spin text-orange-hero" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando extrato...</p>
        </div>
      </JumperBackground>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <JumperBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                {error || 'Link não encontrado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Não foi possível carregar este extrato. Verifique se o link está correto ou entre em contato com seu gestor.
              </p>
              <JumperButton onClick={() => navigate('/')} variant="outline" className="w-full">
                Voltar ao Início
              </JumperButton>
            </CardContent>
          </Card>
        </div>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <JumperLogo variant="full" className="h-8" />
            <Badge variant="outline" className="gap-2">
              <Lock className="h-3 w-3" />
              Extrato Compartilhado
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Account Info Card */}
          <Card className="mb-8 border-l-4 border-l-orange-hero">
            <CardHeader>
              <CardTitle className="text-2xl">{data.recording.account_name}</CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(data.recording.recorded_at), "PPP 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Gestor: {data.recording.recorded_by}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Objectives */}
              {data.recording.objectives && data.recording.objectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.recording.objectives.map((obj, idx) => (
                    <Badge key={idx} variant="secondary">
                      {obj}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Extract */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-hero" />
              Extrato de Otimização
            </h2>

            {data.context ? (
              <OptimizationContextCard
                context={data.context}
                accountName={data.recording.account_name}
                recordedBy={data.recording.recorded_by}
                recordedAt={new Date(data.recording.recorded_at)}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Análise em processamento...</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
            <p>
              Gerado em {format(new Date(), "PPP 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="mt-2">
              Powered by{' '}
              <span className="font-semibold text-orange-hero">Jumper Studio</span>
            </p>
          </div>
        </div>
      </div>
    </JumperBackground>
  );
}
