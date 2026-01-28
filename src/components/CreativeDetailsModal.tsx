/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CreativeFile {
  name: string;
  type: string;
  size: number;
  public_url: string;
  variation_index: number;
}

interface CreativePayload {
  platform?: string;
  campaignObjective?: string;
  creativeType?: string;
  creativeName?: string;
  observations?: string;
  mainTexts?: string[];
  titles?: string[];
  description?: string;
  callToAction?: string;
  cta?: string;
  destinationUrl?: string;
}

interface CreativeResult {
  success?: boolean;
  logs?: string[];
  createdCreatives?: any[];
  error?: string;
  stack?: string;
}

interface CreativeSubmission {
  id: string;
  creative_name: string;
  campaign_objective: string;
  creative_type: string;
  brief_description: string;
  created_at: string;
  status: string;
  account_id: string;
  manager_email: string;
  client_name?: string;
  client?: string;
  manager_name?: string;
  updated_at?: string;
  platform?: string;
  total_variations?: number;
  error?: string;
  payload?: CreativePayload;
  files?: CreativeFile[];
  result?: CreativeResult;
}

interface CreativeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: CreativeSubmission;
}

export const CreativeDetailsModal: React.FC<CreativeDetailsModalProps> = ({
  isOpen,
  onClose,
  submission
}) => {
  const { toast } = useToast();

  if (!submission) return null;

  const payload = (submission.payload || {}) as CreativePayload;
  const files = (submission.files || []) as CreativeFile[];
  const result = (submission.result || {}) as CreativeResult;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusInPortuguese = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Rascunho',
      'pending': 'Pendente',
      'queued': 'Na Fila',
      'processing': 'Processando',
      'processed': 'Processado',
      'published': 'Publicado',
      'error': 'Erro'
    };
    return statusMap[status] || status;
  };

  const getPlatformDisplay = (platform: string) => {
    if (platform === 'meta') return 'Meta';
    if (platform === 'google') return 'Google';
    return platform;
  };

  const getCreativeTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single': 'Imagem/Vídeo Único',
      'carousel': 'Carrossel',
      'collection': 'Coleção',
      'existing-post': 'Publicação Existente'
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] min-h-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Detalhes do Criativo</DialogTitle>
          <DialogDescription>
            Visualize as informações completas da submissão incluindo logs e resultados da publicação.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <p className="text-sm text-muted-foreground">{submission.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <p className="text-sm text-muted-foreground">{getStatusInPortuguese(submission.status)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Conta:</span>
                    <p className="text-sm text-muted-foreground">{submission.client_name || submission.client || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Gerente:</span>
                    <p className="text-sm text-muted-foreground">{submission.manager_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Criado em:</span>
                    <p className="text-sm text-muted-foreground">{formatDate(submission.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Atualizado em:</span>
                    <p className="text-sm text-muted-foreground">{submission.updated_at ? formatDate(submission.updated_at) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 1. CONFIGURAÇÕES */}
            <Card>
              <CardHeader>
                <CardTitle>1. Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Plataforma:</span>
                    <p className="text-sm text-muted-foreground">{getPlatformDisplay(payload.platform || submission.platform || '—')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Objetivo:</span>
                    <p className="text-sm text-muted-foreground">{payload.campaignObjective || submission.campaign_objective || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <p className="text-sm text-muted-foreground">{getCreativeTypeDisplay(payload.creativeType || submission.creative_type || '—')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Nome do Criativo:</span>
                    <p className="text-sm text-muted-foreground">{payload.creativeName || '—'}</p>
                  </div>
                  {payload.observations && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium">Observações:</span>
                      <p className="text-sm text-muted-foreground">{payload.observations}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. ARQUIVOS */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Arquivos ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((file: CreativeFile, index: number) => (
                      <div key={index} className="flex items-center justify-between border rounded p-3">
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.type} • {formatFileSize(file.size)} • Variação {(file.variation_index || 0) + 1}
                          </p>
                        </div>
                        {file.public_url && (
                          <a 
                            href={file.public_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Ver arquivo
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. CONTEÚDO */}
            {(payload.mainTexts || payload.titles || payload.description || payload.callToAction || payload.cta || payload.destinationUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>3. Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payload.mainTexts && (
                      <div>
                        <span className="text-sm font-medium">Textos Principais:</span>
                        <div className="mt-1">
                          {payload.mainTexts.map((text: string, index: number) => (
                            <p key={index} className="text-sm text-muted-foreground mb-1">• {text}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {payload.titles && (
                      <div>
                        <span className="text-sm font-medium">Títulos:</span>
                        <div className="mt-1">
                          {payload.titles.map((title: string, index: number) => (
                            <p key={index} className="text-sm text-muted-foreground mb-1">• {title}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {payload.description && (
                      <div>
                        <span className="text-sm font-medium">Descrição:</span>
                        <p className="text-sm text-muted-foreground">{payload.description}</p>
                      </div>
                    )}
                    {(payload.callToAction || payload.cta) && (
                      <div>
                        <span className="text-sm font-medium">Call to Action:</span>
                        <p className="text-sm text-muted-foreground">{payload.callToAction || payload.cta}</p>
                      </div>
                    )}
                    {payload.destinationUrl && (
                      <div>
                        <span className="text-sm font-medium">URL de Destino:</span>
                        <p className="text-sm text-muted-foreground break-all">{payload.destinationUrl}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium">Total de Variações:</span>
                      <p className="text-sm text-muted-foreground">{submission.total_variations || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultado da Publicação */}
            {result && (result.logs || result.createdCreatives || result.error) && (
              <Card>
                <CardHeader>
                  <CardTitle className={result.success ? "text-primary" : "text-destructive"}>
                    {result.success ? "✅ Resultado da Publicação" : "❌ Erro na Publicação"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.logs && (
                    <div>
                      <span className="text-sm font-medium">Logs do Processamento:</span>
                      <ScrollArea className="h-40 w-full border rounded p-3 mt-2">
                        <div className="space-y-1">
                          {result.logs.map((log: string, index: number) => (
                            <div key={index} className="text-xs font-mono">
                              {log}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {result.success && result.createdCreatives && (
                    <div>
                      <span className="text-sm font-medium">Criativos criados no Notion:</span>
                      <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.createdCreatives, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div>
                      <span className="text-sm font-medium text-destructive">Mensagem de Erro:</span>
                      <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
                      {result.stack && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Stack Trace:</span>
                          <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                            {result.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                        toast({ 
                          title: "Copiado!", 
                          description: "Resultado completo copiado para área de transferência" 
                        });
                      }}
                    >
                      Copiar JSON Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Erro (só mostra se houver e o status não for success e não tiver result) */}
            {submission.error && submission.status !== 'processed' && submission.status !== 'published' && !result?.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Erro</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.error}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};