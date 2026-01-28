/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FormData } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, FileText, Image, Video, Users, User, Instagram, ExternalLink, Hash, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { previewCreativeNameDetailed, getObjectiveCode, getTypeCode } from '@/utils/creativeName';
import { supabase } from '@/integrations/supabase/client';
import { validateCTA } from '@/utils/ctaValidation';
import { VALID_CTAS } from '@/types/creative';
import { useToast } from '@/hooks/use-toast';

// Logging types
interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

interface SubmissionError {
  message: string;
  stack?: string;
  name?: string;
  status?: number;
  details?: any;
}

interface Step4Props {
  formData: FormData;
  isSubmitting: boolean;
  submissionLog?: LogEntry[];
  submissionError?: SubmissionError | null;
  lastInvoke?: { data?: unknown; error?: unknown } | null;
  onClearLog?: () => void;
}

const Step4: React.FC<Step4Props> = ({ 
  formData, 
  isSubmitting, 
  submissionLog = [], 
  submissionError,
  lastInvoke,
  onClearLog 
}) => {
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLogExpanded, setIsLogExpanded] = React.useState(false);

  // Check if this is an existing post
  const isExistingPost = formData.creativeType === 'existing-post';

  // Get client name
  const selectedClient = clients.find(c => c.id === formData.client);
  const clientName = selectedClient?.name || 'Cliente não encontrado';

  // Fetch account code via edge function for accurate preview
  const [accountCode, setAccountCode] = React.useState<string | null>(null);
  React.useEffect(() => {
    let isMounted = true;
    async function fetchAccountCode() {
      if (!formData.client) { if (isMounted) setAccountCode(null); return; }
      try {
        const { data, error } = await supabase.functions.invoke('j_hub_manager_dashboard', {
          body: { action: 'accountCode', notionId: formData.client },
        });
        if (!error && data?.success && isMounted) {
          setAccountCode(data.accountCode || null);
        } else if (isMounted) {
          setAccountCode(null);
        }
      } catch (_) {
        if (isMounted) setAccountCode(null);
      }
    }
    fetchAccountCode();
    return () => { isMounted = false; };
  }, [formData.client]);

  // Generate preview of final creative name using detailed function (prefer accurate account code)
  const finalCreativeName = React.useMemo(() => {
    if (
      formData.creativeName && 
      formData.campaignObjective && 
      formData.creativeType && 
      selectedClient
    ) {
      if (accountCode) {
        const obj = getObjectiveCode(formData.campaignObjective);
        const type = getTypeCode(formData.creativeType);
        return `JSC-XXX_${formData.creativeName}_${obj}_${type}_${accountCode}`;
      }
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        formData.creativeType,
        selectedClient.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, selectedClient, accountCode]);

  // Validate CTA
  const ctaValidation = validateCTA(formData.cta || formData.callToAction || '');
  
  // Check for validation issues based on creative type
  const getValidationIssues = () => {
    const issues: string[] = [];
    
    // Add CTA validation issue if applicable
    if (!ctaValidation.isValid) {
      issues.push(`CTA "${formData.cta || formData.callToAction}" não é válido. Sugestão: "${ctaValidation.suggestion}"`);
    }
    if (formData.creativeType === 'carousel') {
      // For carousel, check carouselCards
      if (!formData.carouselCards || formData.carouselCards.length === 0) {
        issues.push('Nenhum cartão de carrossel encontrado');
      } else {
        const invalidCards = formData.carouselCards.filter(card => !card.file || !card.file.valid);
        if (invalidCards.length > 0) {
          issues.push(`${invalidCards.length} cartão(s) do carrossel com problemas`);
        }
      }
      
      return issues;
    } else if (formData.creativeType === 'single') {
      // For single, check mediaVariations
      if (!formData.mediaVariations || formData.mediaVariations.length === 0) {
        issues.push('Nenhuma variação de mídia encontrada');
      } else {
        formData.mediaVariations.forEach((variation, index) => {
          const requiredPositions = [];
          if (variation.squareEnabled !== false) requiredPositions.push('square');
          if (variation.verticalEnabled !== false) requiredPositions.push('vertical');
          if (variation.horizontalEnabled !== false) requiredPositions.push('horizontal');
          
          const missingFiles = requiredPositions.filter(position => {
            const file = variation[`${position}File`];
            return !file || !file.valid;
          });
          
          if (missingFiles.length > 0) {
            issues.push(`Variação ${index + 1}: ${missingFiles.join(', ')} com problemas`);
          }
        });
      }
      
      return issues;
    } else if (formData.creativeType === 'existing-post') {
      // For existing post, check URL validation
      if (!formData.existingPost || !formData.existingPost.valid) {
        issues.push('URL da publicação do Instagram inválida ou não fornecida');
      }
      return issues;
    } else {
      // For other types, check validatedFiles
      const invalidFiles = formData.validatedFiles.filter(f => !f.valid);
      if (invalidFiles.length > 0) {
        issues.push(`${invalidFiles.length} arquivo(s) com problemas`);
      }
      
      return issues;
    }
  };

  const validationIssues = getValidationIssues();
  const hasValidationIssues = validationIssues.length > 0;

  // Count total files based on creative type
  const getTotalFiles = () => {
    if (formData.creativeType === 'carousel') {
      return formData.carouselCards?.filter(card => card.file).length || 0;
    } else if (formData.creativeType === 'single') {
      let totalFiles = 0;
      formData.mediaVariations?.forEach(variation => {
        if (variation.squareFile) totalFiles++;
        if (variation.verticalFile) totalFiles++;
        if (variation.horizontalFile) totalFiles++;
      });
      return totalFiles;
    } else if (formData.creativeType === 'existing-post') {
      return formData.existingPost && formData.existingPost.valid ? 1 : 0;
    } else {
      return formData.validatedFiles.length;
    }
  };

  const totalFiles = getTotalFiles();

  // Copy log to clipboard
  const copyLogToClipboard = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      events: submissionLog,
      error: submissionError,
      lastInvokeSummary: lastInvoke ? {
        hasData: Boolean(lastInvoke.data),
        hasError: Boolean(lastInvoke.error),
        dataKeys: lastInvoke.data ? Object.keys(lastInvoke.data) : undefined,
        errorMessage: (lastInvoke.error as any)?.message
      } : null
    };
    
    navigator.clipboard.writeText(JSON.stringify(logData, null, 2)).then(() => {
      toast({
        title: "Log copiado!",
        description: "O log foi copiado para a área de transferência."
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o log.",
        variant: "destructive"
      });
    });
  };

  // Format timestamp for display
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('pt-BR');
  };

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📋 Revisão Final</h2>
        <p className="text-muted-foreground">Confira todas as informações antes de enviar</p>
      </div>

      {/* Creative Name Preview */}
      {finalCreativeName && (
        <div className="bg-accent-subtle/10 border border-accent-subtle/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Hash className="h-5 w-5 text-accent-subtle" />
            <h3 className="font-semibold text-accent-subtle">Nome Final do Criativo</h3>
          </div>
          <div className="bg-card border border-accent-border rounded-md p-3">
            <p className="text-sm font-mono text-accent-subtle break-all">{finalCreativeName}</p>
          </div>
          <p className="text-xs text-accent-subtle mt-2">
            Este será o nome usado no Facebook Ads Manager e no Notion
          </p>
        </div>
      )}

      {/* Validation Issues Alert */}
      {hasValidationIssues && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong>
            <br />
            {formData.creativeType === 'existing-post' 
              ? 'Existe um problema com a URL da publicação. Volte para a etapa anterior e corrija.'
              : 'Existem arquivos com problemas. Volte para a etapa de upload e corrija os arquivos inválidos.'
            }
            <ul className="mt-2 ml-4 list-disc">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {!hasValidationIssues && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Tudo pronto!</strong> Seu criativo está válido e pode ser salvo.
            <br />
            <span className="text-xs mt-1 block text-green-600">
              📝 Após salvar, o criativo ficará pendente para aprovação do Admin. O Admin então publicará no Notion.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info Card */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-foreground">Informações Básicas</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="break-words"><span className="font-medium">Cliente:</span> <span className="break-all">{clientName}</span></div>
            <div className="break-words"><span className="font-medium">Nome:</span> <span className="break-all">{formData.creativeName}</span></div>
            <div className="break-words"><span className="font-medium">Plataforma:</span> {formData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
            {formData.campaignObjective && (
              <div className="break-words"><span className="font-medium">Objetivo:</span> <span className="break-all">{formData.campaignObjective}</span></div>
            )}
            {formData.creativeType && (
              <div className="break-words"><span className="font-medium">Tipo:</span> {
                formData.creativeType === 'single' ? 'Anúncio Único' :
                formData.creativeType === 'carousel' ? 'Carrossel' : 
                formData.creativeType === 'existing-post' ? 'Publicação Existente' : 'Coleção'
              }</div>
            )}
          </div>
        </div>

        {/* Manager Info Card */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-foreground">Gerente Responsável</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="break-words"><span className="font-medium">Nome:</span> <span className="break-all">{currentUser?.name || 'Não identificado'}</span></div>
            {currentUser?.email && (
              <div className="break-words"><span className="font-medium">E-mail:</span> <span className="break-all">{currentUser.email}</span></div>
            )}
          </div>
        </div>

        {/* Files/Content Card */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            {formData.creativeType === 'carousel' ? (
              <Image className="h-5 w-5 text-jumper-blue" />
            ) : formData.creativeType === 'existing-post' ? (
              <Instagram className="h-5 w-5 text-pink-500" />
            ) : (
              <FileText className="h-5 w-5 text-jumper-blue" />
            )}
            <h3 className="font-semibold text-foreground">
              {formData.creativeType === 'carousel' ? 'Cartões do Carrossel' : 
               formData.creativeType === 'existing-post' ? 'Publicação do Instagram' : 'Arquivos'}
            </h3>
          </div>
          <div className="text-sm space-y-2">
            <div className="mb-2">
              <span className="font-medium">
                {formData.creativeType === 'existing-post' ? 'Publicação:' : 'Total de arquivos:'}
              </span> {formData.creativeType === 'existing-post' ? '1 post do Instagram' : totalFiles}
            </div>
            
            {/* Show Instagram post details for existing-post */}
            {formData.creativeType === 'existing-post' && formData.existingPost && formData.existingPost.valid && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mt-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="font-medium text-pink-800">Detalhes da Publicação</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">Tipo:</span> {
                      formData.existingPost.contentType === 'post' ? 'Post' :
                      formData.existingPost.contentType === 'reel' ? 'Reel' : 'IGTV'
                    }</div>
                    {formData.existingPost.username && (
                      <div><span className="font-medium">Perfil:</span> @{formData.existingPost.username}</div>
                    )}
                    {formData.existingPost.postId && (
                      <div><span className="font-medium">ID:</span> {formData.existingPost.postId}</div>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.existingPost.instagramUrl, '_blank')}
                      className="text-pink-600 border-pink-300 hover:bg-pink-100 text-xs h-7 px-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {formData.creativeType === 'carousel' && formData.carouselAspectRatio && (
              <div className="break-words">
                <span className="font-medium">Proporção:</span> <span className="break-all">{formData.carouselAspectRatio}</span>
              </div>
            )}
            {formData.creativeType === 'single' && formData.mediaVariations && (
              <div>
                <span className="font-medium">Variações:</span> {formData.mediaVariations.length}
              </div>
            )}
            {formData.creativeType === 'existing-post' && formData.existingPost && (
              <div className="break-words">
                <span className="font-medium">URL:</span> 
                <span className="break-all ml-1">
                  {formData.existingPost.instagramUrl.substring(0, 40)}
                  {formData.existingPost.instagramUrl.length > 40 ? '...' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Card - Hide for existing-post */}
        {!isExistingPost && (
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-5 w-5 text-jumper-blue" />
              <h3 className="font-semibold text-foreground">Conteúdo</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Títulos:</span> {formData.titles?.length || 0}</div>
              <div><span className="font-medium">Textos principais:</span> {formData.mainTexts?.length || 0}</div>
              {formData.description && (
                <div className="break-words">
                  <span className="font-medium">Descrição:</span> 
                  <span className="break-all ml-1">
                    {formData.description.substring(0, 50)}{formData.description.length > 50 ? '...' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA & Destination Card */}
        <div className={`bg-card border rounded-lg p-6 shadow-sm ${isExistingPost ? 'col-span-full md:col-span-1' : 'col-span-full'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-foreground">Call-to-Action & Destino</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="break-words">
              {formData.cta && (
                <div><span className="font-medium">CTA:</span> <span className="break-all ml-1">{formData.cta}</span></div>
              )}
              {formData.callToAction && !formData.cta && (
                <div><span className="font-medium">CTA:</span> <span className="break-all ml-1">{formData.callToAction}</span></div>
              )}
            </div>
            <div className="break-words">
              {formData.destinationUrl && (
                <div>
                  <span className="font-medium">Destino:</span> 
                  <span className="break-all ml-1">
                    {formData.destinationUrl.substring(0, 40)}{formData.destinationUrl.length > 40 ? '...' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      {formData.observations && (
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Observações</h3>
          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{formData.observations}</p>
        </div>
      )}

      {/* Submission Error Log */}
      {(submissionError || submissionLog.length > 0) && (
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Log do Envio</h3>
            <div className="flex space-x-2">
              {submissionLog.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLogToClipboard}
                  className="text-xs h-7"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar log
                </Button>
              )}
              {onClearLog && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearLog}
                  className="text-xs h-7"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar log
                </Button>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {submissionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro durante o envio:</strong>
                <br />
                {submissionError.message}
                {submissionError.status && (
                  <span className="text-xs block mt-1">Status: {submissionError.status}</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Log Details - Collapsible */}
          {submissionLog.length > 0 && (
            <Collapsible open={isLogExpanded} onOpenChange={setIsLogExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">Detalhes técnicos ({submissionLog.length} eventos)</span>
                  {isLogExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-3">
                  {/* Request Summary */}
                  {submissionLog.some(log => log.message.includes('Preparando dados')) && (
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2">Resumo da Requisição</h4>
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">Função chamada:</span> j_ads_ingest_creative</div>
                        {submissionLog
                          .filter(log => log.message.includes('Preparando dados'))
                          .map((log, i) => (
                            <div key={i}>
                              {log.data && typeof log.data === 'object' && 'totalFiles' in log.data && (
                                <div><span className="font-medium">Total de arquivos:</span> {(log.data as any).totalFiles}</div>
                              )}
                              {log.data && typeof log.data === 'object' && 'fileCountsByFormat' in log.data && (
                                <div><span className="font-medium">Por formato:</span> {JSON.stringify((log.data as any).fileCountsByFormat)}</div>
                              )}
                              {log.data && typeof log.data === 'object' && 'payloadSizeKB' in log.data && (
                                <div><span className="font-medium">Tamanho estimado:</span> {(log.data as any).payloadSizeKB}</div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Event Log */}
                  <div className="bg-muted/50 border rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2">Cronologia de Eventos</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {submissionLog.map((log, i) => (
                        <div key={i} className="text-xs border-l-2 pl-2" style={{
                          borderLeftColor: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#3b82f6'
                        }}>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">{formatTime(log.ts)}</span>
                            <span className={`font-medium ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span>{log.message}</span>
                          </div>
                          {log.data && (
                            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                              {JSON.stringify(log.data, null, 2).slice(0, 200)}
                              {JSON.stringify(log.data).length > 200 ? '...' : ''}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Details */}
                  {submissionError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-900 mb-3">Detalhes do Erro</h4>
                      <div className="text-sm space-y-2 text-red-800">
                        {submissionError.name && (
                          <div><span className="font-semibold">Tipo:</span> {submissionError.name}</div>
                        )}
                        {submissionError.status && (
                          <div><span className="font-semibold">Status:</span> {submissionError.status}</div>
                        )}
                        {submissionError.details && (
                          <div>
                            <span className="font-semibold">Detalhes:</span>
                            <pre className="mt-2 text-xs bg-red-100 border border-red-300 p-3 rounded whitespace-pre-wrap font-mono text-red-900">
                              {JSON.stringify(submissionError.details, null, 2).slice(0, 500)}
                              {JSON.stringify(submissionError.details).length > 500 ? '...' : ''}
                            </pre>
                          </div>
                        )}
                        {!submissionError.details && (
                          <div className="text-red-700">Sem detalhes adicionais</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jumper-blue mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Salvando criativo...</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde enquanto processamos sua submissão</p>
          {submissionLog.length > 0 && (
            <div className="mt-4 text-left max-w-md mx-auto">
              <div className="bg-muted/50 border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Progresso em tempo real:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {submissionLog.slice(-5).map((log, i) => (
                    <div key={i} className="text-xs flex items-center space-x-2">
                      <span className="text-muted-foreground">{formatTime(log.ts)}</span>
                      <span className={getLevelColor(log.level)}>•</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step4;
