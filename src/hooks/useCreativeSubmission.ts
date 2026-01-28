/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { FormData } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { performSystemHealthCheck, validateSubmissionReadiness } from '@/utils/systemHealth';
import { ValidationResult } from '@/types/validation';
import { useUserRole } from '@/hooks/useUserRole';
import { LogEntry, createConditionalLogger } from '@/utils/conditionalLogging';

interface SubmissionError {
  message: string;
  stack?: string;
  name?: string;
  status?: number;
  details?: any;
}

export const useCreativeSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);
  const [submissionLog, setSubmissionLog] = useState<LogEntry[]>([]);
  const [submissionError, setSubmissionError] = useState<SubmissionError | null>(null);
  const [lastInvoke, setLastInvoke] = useState<{ data?: unknown; error?: unknown } | null>(null);
  const { currentUser } = useAuth();
  const { userRole } = useUserRole();

  // Helper to sanitize data by removing base64Data
  const sanitizeData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    if (Array.isArray(data)) {
      return data.map(sanitizeData);
    }
    
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (key === 'base64Data') {
        sanitized[key] = '<omitted>';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    return sanitized;
  };

  // Create conditional logger based on user role
  const logger = createConditionalLogger(userRole, setSubmissionLog, sanitizeData);
  const { pushLog, consoleLog, consoleWarn, consoleError } = logger;

  // Reset submission log
  const resetSubmissionLog = () => {
    setSubmissionLog([]);
    setSubmissionError(null);
    setLastInvoke(null);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const submitForm = async (formData: FormData, validateStep: (step: number) => ValidationResult, toast: any, options?: { submissionId?: string }) => {
    // Reset previous error state
    setSubmissionError(null);
    setLastInvoke(null);
    
    // Perform defensive validation with health checks
    pushLog('info', 'Iniciando validação defensiva do sistema');
    
    try {
      const validationResult = await validateSubmissionReadiness(formData);
      
      // Log health status for debugging
      pushLog('info', 'Status de saúde do sistema verificado', {
        canProceed: validationResult.canProceed,
        blockers: validationResult.blockers,
        warnings: validationResult.warnings,
        systemHealth: {
          overall: validationResult.healthStatus.overall,
          canSubmit: validationResult.healthStatus.canSubmit,
          services: Object.keys(validationResult.healthStatus.services).reduce((acc, key) => {
            const service = validationResult.healthStatus.services[key as keyof typeof validationResult.healthStatus.services];
            acc[key] = { healthy: service.healthy, responseTime: service.responseTime };
            return acc;
          }, {} as Record<string, any>)
        }
      });
      
      // Show warnings to user but don't block submission
      if (validationResult.warnings.length > 0) {
        const warningMessage = validationResult.warnings.slice(0, 2).join('. ');
        toast({
          title: "Aviso do Sistema",
          description: `${warningMessage}. Sua submissão ainda funcionará.`,
          variant: "default",
        });
      }
      
      // Only block if there are critical blockers
      if (!validationResult.canProceed) {
        const blockerMessage = validationResult.blockers.slice(0, 2).join('. ');
        pushLog('error', 'Submissão bloqueada por problemas críticos', { blockers: validationResult.blockers });
        
        toast({
          title: "Não é possível enviar",
          description: blockerMessage,
          variant: "destructive",
        });
        return;
      }
      
    } catch (healthCheckError) {
      // Health check failed, but don't block submission - just warn
      consoleWarn('Health check failed, proceeding anyway:', healthCheckError);
      pushLog('warn', 'Verificação de saúde falhou, prosseguindo mesmo assim', { error: healthCheckError });
      
      toast({
        title: "Sistema em modo degradado",
        description: "Sua submissão ainda funcionará, mas pode ser mais lenta.",
        variant: "default",
      });
    }
    
    // Traditional form validation as fallback
    const step3Validation = validateStep(3);
    if (!step3Validation.canProceed) {
      const validationError = "Corrija os erros antes de enviar";
      pushLog('error', 'Validação do formulário falhou', { step: 3 });
      toast({
        title: "Erro na validação",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    pushLog('info', 'Iniciando submissão do criativo', { 
      creativeType: formData.creativeType,
      client: formData.client,
      submissionId: options?.submissionId,
      hasExistingPost: Boolean(formData.existingPost),
      hasSavedMedia: Boolean((formData as any).savedMedia)
    });

    consoleLog('🚀 Iniciando submissão do criativo:', { 
      creativeType: formData.creativeType,
      client: formData.client,
      submissionId: options?.submissionId 
    });

    toast({
      title: "Enviando criativo...",
      description: "Processando arquivos e enviando para revisão do Gestor/Admin.",
    });

    try {
      const filesInfo: Array<{
        name: string;
        type: string;
        size: number;
        format?: string;
        variationIndex?: number;
        base64Data?: string;
        url?: string;
        instagramUrl?: string;
      }> = [];

      const savedMedia = (formData as any).savedMedia;

      if (formData.creativeType === 'existing-post' && formData.existingPost) {
        filesInfo.push({
          name: 'Instagram Post',
          type: 'existing-post',
          size: 0,
          instagramUrl: formData.existingPost.instagramUrl,
          variationIndex: 1,
        });
      } else if (savedMedia && formData.creativeType === 'carousel' && Array.isArray(savedMedia.carouselCards)) {
        const ratio = savedMedia.carouselAspectRatio || formData.carouselAspectRatio || '1:1';
        const format = ratio === '1:1' ? 'carousel-1:1' : 'carousel-4:5';
        for (const card of savedMedia.carouselCards) {
          const asset = card?.asset;
          if (asset?.url) {
            filesInfo.push({
              name: asset.name || 'carousel-card',
              type: asset.type || 'application/octet-stream',
              size: asset.size || 0,
              format,
              variationIndex: 1,
              url: asset.url,
            });
          }
        }
      } else if (savedMedia && formData.creativeType === 'single' && Array.isArray(savedMedia.mediaVariations)) {
        for (let i = 0; i < savedMedia.mediaVariations.length; i++) {
          const v = savedMedia.mediaVariations[i];
          const variationIndex = (v?.id && Number.isFinite(v.id)) ? v.id : i + 1;

          if (v?.square?.url) {
            filesInfo.push({
              name: v.square.name || 'square',
              type: v.square.type || 'application/octet-stream',
              size: v.square.size || 0,
              format: 'square',
              variationIndex,
              url: v.square.url,
            });
          }
          if (v?.vertical?.url) {
            filesInfo.push({
              name: v.vertical.name || 'vertical',
              type: v.vertical.type || 'application/octet-stream',
              size: v.vertical.size || 0,
              format: 'vertical',
              variationIndex,
              url: v.vertical.url,
            });
          }
          if (v?.horizontal?.url) {
            filesInfo.push({
              name: v.horizontal.name || 'horizontal',
              type: v.horizontal.type || 'application/octet-stream',
              size: v.horizontal.size || 0,
              format: 'horizontal',
              variationIndex,
              url: v.horizontal.url,
            });
          }
        }
      } else if (formData.creativeType === 'carousel' && formData.carouselCards) {
        for (const card of formData.carouselCards) {
          if (card.file) {
            const base64Data = await convertFileToBase64(card.file.file);
            filesInfo.push({
              name: card.file.file.name,
              type: card.file.file.type,
              size: card.file.file.size,
              format: `carousel-${formData.carouselAspectRatio}`,
              variationIndex: 1,
              base64Data,
            });
          }
        }
      } else if (formData.creativeType === 'single' && formData.mediaVariations) {
        for (const variation of formData.mediaVariations) {
          const index = formData.mediaVariations.indexOf(variation);

          if (variation.squareFile) {
            const base64Data = await convertFileToBase64(variation.squareFile.file);
            filesInfo.push({
              name: variation.squareFile.file.name,
              type: variation.squareFile.file.type,
              size: variation.squareFile.file.size,
              format: 'square',
              variationIndex: index + 1,
              base64Data,
            });
          }
          if (variation.verticalFile) {
            const base64Data = await convertFileToBase64(variation.verticalFile.file);
            filesInfo.push({
              name: variation.verticalFile.file.name,
              type: variation.verticalFile.file.type,
              size: variation.verticalFile.file.size,
              format: 'vertical',
              variationIndex: index + 1,
              base64Data,
            });
          }
          if (variation.horizontalFile) {
            const base64Data = await convertFileToBase64(variation.horizontalFile.file);
            filesInfo.push({
              name: variation.horizontalFile.file.name,
              type: variation.horizontalFile.file.type,
              size: variation.horizontalFile.file.size,
              format: 'horizontal',
              variationIndex: index + 1,
              base64Data,
            });
          }
        }
      } else {
        for (const file of formData.validatedFiles) {
          const base64Data = await convertFileToBase64(file.file);
          filesInfo.push({
            name: file.file.name,
            type: file.file.type,
            size: file.file.size,
            variationIndex: 1,
            base64Data,
          });
        }
      }

      const submissionData = {
        client: formData.client,
        managerUserId: currentUser?.id,
        managerEmail: currentUser?.email,
        partner: formData.partner,
        platform: formData.platform,
        campaignObjective: formData.campaignObjective,
        creativeName: formData.creativeName,
        creativeType: formData.creativeType,
        objective: formData.objective,
        mainTexts: formData.creativeType === 'existing-post' ? [''] : (formData.mainTexts || ['']),
        titles: formData.creativeType === 'existing-post' ? [''] : (formData.titles || ['']),
        description: formData.creativeType === 'existing-post' ? '' : formData.description,
        destination: formData.destination,
        cta: formData.cta,
        destinationUrl: formData.destinationUrl,
        callToAction: formData.callToAction,
        observations: formData.observations,
        existingPost: formData.existingPost,
        filesInfo
      };

      // Log file counts and payload size estimation
      const fileCountsByFormat = filesInfo.reduce((acc: Record<string, number>, file) => {
        const format = file.format || 'unknown';
        acc[format] = (acc[format] || 0) + 1;
        return acc;
      }, {});
      
      const payloadSizeKB = Math.round(JSON.stringify(sanitizeData(submissionData)).length / 1024);
      
      pushLog('info', 'Preparando dados para envio', {
        totalFiles: filesInfo.length,
        fileCountsByFormat,
        payloadSizeKB: `${payloadSizeKB} KB`,
        submissionType: options?.submissionId ? 'update' : 'new'
      });

      consoleLog('Ingesting creative submission:', submissionData);
      
      pushLog('info', 'Chamando edge function j_ads_submit_creative', {
        function: 'j_ads_submit_creative',
        payloadFields: Object.keys(submissionData)
      });
      
      const { data, error } = await supabase.functions.invoke('j_ads_submit_ad', {
        body: { ...submissionData, submissionId: options?.submissionId }
      });
      
      // Store the complete invoke result for debugging
      setLastInvoke({ data, error });

      if (error) {
        consoleError('Supabase function error:', error);
        
        // Capture detailed error information
        const detailedError: SubmissionError = {
          message: error.message || 'Erro ao salvar criativo',
          name: error.name,
          status: (error as any)?.status,
          details: error
        };
        setSubmissionError(detailedError);
        pushLog('error', 'Edge function retornou erro', { error: detailedError });
        
        throw new Error(error.message || 'Erro ao salvar criativo');
      }

      if (!data?.success) {
        const responseError = data?.error || 'Erro desconhecido ao salvar criativo';
        const detailedError: SubmissionError = {
          message: responseError,
          details: data
        };
        setSubmissionError(detailedError);
        pushLog('error', 'Edge function retornou sucesso=false', { error: responseError, data });
        
        throw new Error(responseError);
      }

      pushLog('info', 'Submissão concluída com sucesso', { 
        submissionId: data.submissionId,
        responseData: sanitizeData(data)
      });

      consoleLog('✅ Creative successfully submitted for review:', data);

      setCreativeIds(data.submissionId ? [data.submissionId] : []);
      setIsSubmitted(true);

      const submissionId = data.submissionId || '';

      toast({
        title: `Criativo enviado com sucesso!`,
        description: `ID: ${submissionId}. Aguardando revisão e aprovação do Gestor/Admin para publicação.`,
      });

    } catch (error: any) {
      consoleError('Error submitting creative:', error);
      
      // Capture full error details
      const fullError: SubmissionError = {
        message: error.message || 'Erro desconhecido',
        name: error.name,
        stack: error.stack,
        status: error.status,
        details: error
      };
      
      if (!submissionError) {
        setSubmissionError(fullError);
      }
      
      pushLog('error', 'Falha ao enviar criativo', { error: fullError });
      
      // Provide more specific error messages based on error type
      let errorMessage = "Erro ao enviar criativo. Tente novamente.";
      let errorTitle = "Erro ao enviar";
      
      if (error.message?.includes('non-2xx status code') || error.name === 'FunctionsHttpError') {
        errorTitle = "Sistema em manutenção";
        errorMessage = "O sistema está passando por uma atualização rápida. Por favor, tente novamente em alguns minutos.";
      } else if (error.message?.includes('CTA')) {
        errorMessage = "CTA inválido. Verifique se selecionou um valor válido.";
      } else if (error.message?.includes('Gerente') || error.message?.includes('Manager')) {
        errorMessage = "Erro na validação do gerente. Tente fazer logout e login novamente.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Erro de validação dos dados. Verifique todos os campos obrigatórios.";
      } else if (error.message?.includes('file') || error.message?.includes('upload')) {
        errorMessage = "Erro no processamento dos arquivos. Verifique os arquivos e tente novamente.";
      } else if (error.message?.includes('Memory limit exceeded')) {
        errorMessage = "Erro de memória no servidor. Tente reduzir o tamanho dos arquivos.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsSubmitted(false);
    setCreativeIds([]);
    setIsSubmitting(false);
    resetSubmissionLog();
  };

  return {
    isSubmitting,
    isSubmitted,
    creativeIds,
    submissionLog,
    submissionError,
    lastInvoke,
    submitForm,
    resetSubmission,
    resetSubmissionLog
  };
};
