/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ShareOptimizationModal
 * Modal for creating public shareable links for optimization recordings
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { JumperButton } from '@/components/ui/jumper-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Share2,
  Lock,
  Calendar,
  Loader2,
} from 'lucide-react';

interface ShareOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  accountName: string;
  recordedAt: string;
}

export function ShareOptimizationModal({
  open,
  onOpenChange,
  recordingId,
  accountName,
  recordedAt,
}: ShareOptimizationModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [shareData, setShareData] = useState<{
    url: string;
    expires_at: string | null;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('never');

  const handleCreateShare = async () => {
    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const requestBody: {
        recording_id: string;
        expires_days?: number;
      } = {
        recording_id: recordingId,
      };

      // Add expiration if selected
      if (expirationDays !== 'never') {
        requestBody.expires_days = parseInt(expirationDays);
      }

      // Use Supabase client to invoke function (correct URL handling)
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'j_hub_optimization_create_share',
        {
          body: requestBody,
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao criar link de compartilhamento');
      }

      setShareData({
        url: result.url,
        expires_at: result.expires_at,
      });

      toast.success('Link público criado!');
    } catch (error: any) {
      console.error('Error creating share:', error);
      toast.error(error.message || 'Erro ao criar link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Link copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const copyFormattedMessage = async () => {
    if (!shareData) return;

    const formattedDate = new Date(recordedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const message = `Olá! 👋

Segue o link público para visualizar a análise de otimização da conta *${accountName}* do dia ${formattedDate}:

🔗 *Link de Acesso:*
${shareData.url}

${shareData.expires_at ? `⏰ Este link expira em ${new Date(shareData.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}\n\n` : ''}Basta clicar no link para visualizar a análise completa.

Qualquer dúvida, estou à disposição!`;

    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
      toast.success('Mensagem copiada! Cole no WhatsApp ou email');
    } catch (error) {
      toast.error('Erro ao copiar mensagem');
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setShareData(null);
    setExpirationDays('never');
    setCopiedUrl(false);
    setCopiedMessage(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-hero" />
            Compartilhar Otimização
          </DialogTitle>
          <DialogDescription>
            Crie um link público para compartilhar esta análise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Account Info */}
          <div className="rounded-lg bg-muted/30 p-3 space-y-1">
            <div className="text-sm font-semibold">{accountName}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(recordedAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {!shareData ? (
            // Configuration form
            <>
              <Separator />

              {/* Expiration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiração
                </Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Nunca expira</SelectItem>
                    <SelectItem value="7">Expira em 7 dias</SelectItem>
                    <SelectItem value="30">Expira em 30 dias</SelectItem>
                    <SelectItem value="90">Expira em 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <JumperButton
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Criar Link de Compartilhamento
                  </>
                )}
              </JumperButton>
            </>
          ) : (
            // Share created successfully
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <Separator />

              {/* URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  Link Público
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareData.url}
                    className="font-mono text-xs"
                  />
                  <JumperButton
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareData.url)}
                  >
                    {copiedUrl ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </JumperButton>
                </div>
              </div>

              <Separator />

              {/* Copy Formatted Message Button */}
              <div className="space-y-2">
                <JumperButton
                  onClick={copyFormattedMessage}
                  className="w-full"
                  size="lg"
                >
                  {copiedMessage ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                      Mensagem Copiada!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Copiar Mensagem Completa para Cliente
                    </>
                  )}
                </JumperButton>
                <p className="text-xs text-center text-muted-foreground">
                  📱 Pronto para colar no WhatsApp ou email
                </p>
              </div>

              {/* Expiration Info */}
              {shareData.expires_at && (
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Expira em{' '}
                      {new Date(shareData.expires_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold">📋 Instruções para o cliente:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Envie o link para o cliente (WhatsApp, email, etc.)</li>
                  <li>O cliente acessa diretamente - sem senha necessária</li>
                  <li>A análise será exibida em uma página bonita com branding Jumper</li>
                </ol>
              </div>

              <JumperButton onClick={handleClose} variant="outline" className="w-full">
                Fechar
              </JumperButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
