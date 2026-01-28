/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Add proper types for form data and media variations
import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import ProgressBar from './ProgressBar';
import Breadcrumbs from './Breadcrumbs';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import CreativeNavigation from './CreativeNavigation';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { useNotionClients } from '@/hooks/useNotionData';
import { WarningModal } from '@/components/ui/warning-modal';
import { FinalSubmissionModal } from '@/components/ui/final-submission-modal';
import { ValidationResult } from '@/types/validation';
import { useCreativeForm } from '@/hooks/useCreativeForm';
import { useCreativeSubmission } from '@/hooks/useCreativeSubmission';
import { useValidationTracking } from '@/hooks/useValidationTracking';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { validateFile } from '@/utils/fileValidation';
import { JumperPageLoading, JumperLoadingOverlay } from './ui/jumper-loading';
import type { MediaVariation, CarouselCard, FormData as CreativeFormData } from '@/types/creative';
import type { SavedMedia, SavedMediaVariation, SavedCarouselCard, SavedMediaFile } from '@/types/common';

const STEP_LABELS = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

// Extended file type with saved URL metadata
interface FileWithSavedUrl extends File {
  __source_saved_url?: SavedMediaFile | string;
}

const CreativeSystem: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    step: number;
    validation: ValidationResult;
  } | null>(null);
  const [finalSubmissionModal, setFinalSubmissionModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, message: '' });
  const { clients, loading: isLoadingClients, error: clientsError, isAdmin, userAccessibleAccounts } = useNotionClients();
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(() =>
    (typeof window !== 'undefined' ? sessionStorage.getItem('draftSubmissionId') : null)
  );
  
  const {
    formData,
    errors,
    updateFormData,
    resetForm,
    validateStep,
    toast
  } = useCreativeForm();

  // Evita reidratar múltiplas vezes ao entrar/sair do Step 2
  const rehydratedRef = useRef(false);

  const {
    isSubmitting,
    isSubmitted,
    creativeIds,
    submissionLog,
    submissionError,
    lastInvoke,
    submitForm,
    resetSubmission,
    resetSubmissionLog
  } = useCreativeSubmission();

  const { logValidation, getValidationSummary } = useValidationTracking();
  const { currentUser } = useAuth();
  
  // Extract draft ID from route params or query string
  const { id: routeId } = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const queryDraftId = searchParams.get('draft');
  const routeSubmissionId = routeId || queryDraftId;

  // Upload a single asset to Supabase Storage and return metadata for rehydration
  const uploadAsset = async (file: File, format: string) => {
    const originalName = file.name || `${format}`;
    const ext = originalName.includes('.') ? originalName.split('.').pop() : undefined;
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const user = currentUser?.id || 'anon';
    const subId = routeSubmissionId || 'new';
    const safeExt = ext ? `.${ext}` : '';
    const path = `drafts/${user}/${subId}/${ts}-${rand}-${format}${safeExt}`;

    const { error } = await supabase.storage
      .from('creative-files')
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('creative-files').getPublicUrl(path);
    return {
      url: urlData.publicUrl,
      path,
      name: originalName,
      type: file.type,
      size: file.size,
      format,
    };
  };

  // Build savedMedia object by uploading all present files in the form with progress tracking
  const buildSavedMedia = async (onProgress?: (current: number, total: number, message: string) => void): Promise<SavedMedia> => {
    const saved: SavedMedia = {};
    let uploadedCount = 0;
    let totalFiles = 0;

    // Count total files that need to be uploaded (excluding already saved ones)
    let reusedFiles = 0;
    if (Array.isArray(formData.mediaVariations)) {
      formData.mediaVariations.forEach((v: MediaVariation) => {
        if (v.squareFile?.file) {
          if (v.squareFile.file.__source_saved_url) reusedFiles++;
          else totalFiles++;
        }
        if (v.verticalFile?.file) {
          if (v.verticalFile.file.__source_saved_url) reusedFiles++;
          else totalFiles++;
        }
        if (v.horizontalFile?.file) {
          if (v.horizontalFile.file.__source_saved_url) reusedFiles++;
          else totalFiles++;
        }
      });
    }
    if (Array.isArray((formData as any).carouselCards)) {
      (formData as any).carouselCards.forEach((c: any) => {
        if (c.file?.file) {
          if (c.file.file.__source_saved_url) reusedFiles++;
          else totalFiles++;
        }
      });
    }

    console.log(`📊 Upload stats: ${totalFiles} novos arquivos, ${reusedFiles} reutilizados`);
    onProgress?.(0, totalFiles, `Iniciando uploads (${totalFiles} arquivos)...`);

    if (Array.isArray(formData.mediaVariations) && formData.mediaVariations.length > 0) {
      const variations = await Promise.all(
        formData.mediaVariations.map(async (v: any) => {
          const entry: any = {
            id: v.id,
            squareEnabled: v.squareEnabled,
            verticalEnabled: v.verticalEnabled,
            horizontalEnabled: v.horizontalEnabled,
          };
          
          // Only upload if file doesn't have saved URL, otherwise reuse existing URL
          if (v.squareFile?.file) {
            if (v.squareFile.file.__source_saved_url) {
              // Normalize saved URL metadata - handle both string (legacy) and object formats
              const savedUrl = v.squareFile.file.__source_saved_url;
              entry.square = typeof savedUrl === 'string' ? {
                url: savedUrl,
                path: `legacy/${Date.now()}`,
                name: v.squareFile.file.name || 'square',
                type: v.squareFile.file.type || 'application/octet-stream',
                size: v.squareFile.file.size || 0,
                format: 'square'
              } : savedUrl;
            } else {
              onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo quadrado ${v.id}...`);
              entry.square = await uploadAsset(v.squareFile.file, 'square');
              // Mark file as saved to avoid re-uploading
              Object.defineProperty(v.squareFile.file, '__source_saved_url', {
                value: entry.square,
                writable: false,
                enumerable: false
              });
            }
          }
          
          if (v.verticalFile?.file) {
            if (v.verticalFile.file.__source_saved_url) {
              // Normalize saved URL metadata - handle both string (legacy) and object formats
              const savedUrl = v.verticalFile.file.__source_saved_url;
              entry.vertical = typeof savedUrl === 'string' ? {
                url: savedUrl,
                path: `legacy/${Date.now()}`,
                name: v.verticalFile.file.name || 'vertical',
                type: v.verticalFile.file.type || 'application/octet-stream',
                size: v.verticalFile.file.size || 0,
                format: 'vertical'
              } : savedUrl;
            } else {
              onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo vertical ${v.id}...`);
              entry.vertical = await uploadAsset(v.verticalFile.file, 'vertical');
              // Mark file as saved to avoid re-uploading
              Object.defineProperty(v.verticalFile.file, '__source_saved_url', {
                value: entry.vertical,
                writable: false,
                enumerable: false
              });
            }
          }
          
          if (v.horizontalFile?.file) {
            if (v.horizontalFile.file.__source_saved_url) {
              // Normalize saved URL metadata - handle both string (legacy) and object formats
              const savedUrl = v.horizontalFile.file.__source_saved_url;
              entry.horizontal = typeof savedUrl === 'string' ? {
                url: savedUrl,
                path: `legacy/${Date.now()}`,
                name: v.horizontalFile.file.name || 'horizontal',
                type: v.horizontalFile.file.type || 'application/octet-stream',
                size: v.horizontalFile.file.size || 0,
                format: 'horizontal'
              } : savedUrl;
            } else {
              onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo horizontal ${v.id}...`);
              entry.horizontal = await uploadAsset(v.horizontalFile.file, 'horizontal');
              // Mark file as saved to avoid re-uploading
              Object.defineProperty(v.horizontalFile.file, '__source_saved_url', {
                value: entry.horizontal,
                writable: false,
                enumerable: false
              });
            }
          }
          
          return entry;
        })
      );
      saved.mediaVariations = variations;
    }

    if (Array.isArray((formData as any).carouselCards) && (formData as any).carouselCards.length > 0) {
      const cards = await Promise.all(
        (formData as any).carouselCards.map(async (c: any) => {
          const entry: any = { id: c.id };
          if (c.file?.file) {
            if (c.file.file.__source_saved_url) {
              // Normalize saved URL metadata - handle both string (legacy) and object formats
              const savedUrl = c.file.file.__source_saved_url;
              entry.asset = typeof savedUrl === 'string' ? {
                url: savedUrl,
                path: `legacy/${Date.now()}`,
                name: c.file.file.name || `card-${c.id}`,
                type: c.file.file.type || 'application/octet-stream',
                size: c.file.file.size || 0,
                format: 'carousel'
              } : savedUrl;
            } else {
              const ratio = (formData.carouselAspectRatio || '1:1') === '1:1' ? 'carousel-1:1' : 'carousel-4:5';
              onProgress?.(++uploadedCount, totalFiles, `Enviando cartão ${c.id}...`);
              entry.asset = await uploadAsset(c.file.file, ratio);
              // Mark file as saved to avoid re-uploading
              Object.defineProperty(c.file.file, '__source_saved_url', {
                value: entry.asset,
                writable: false,
                enumerable: false
              });
            }
          }
          // Preserve per-card custom fields without the heavy file
          if (c.customTitle) entry.customTitle = c.customTitle;
          if (c.customDescription) entry.customDescription = c.customDescription;
          if (c.customDestinationUrl) entry.customDestinationUrl = c.customDestinationUrl;
          if (c.customCta) entry.customCta = c.customCta;
          return entry;
        })
      );
      saved.carouselCards = cards;
      saved.carouselAspectRatio = formData.carouselAspectRatio || '1:1';
    }

    if ((formData as any).existingPost) {
      saved.existingPost = (formData as any).existingPost;
    }

    return saved;
  };

  // From savedMedia, reconstruct ValidatedFile objects and inject them back into formData
  async function rehydrateFilesFromSavedMedia(savedMedia: any, payload: any) {
    const newData: any = { ...payload };
    let hadFailures = false;

    console.log('🔄 Rehydrating files from savedMedia:', {
      hasVariations: Boolean(savedMedia.mediaVariations),
      variationsCount: savedMedia.mediaVariations?.length || 0,
      hasCarouselCards: Boolean(savedMedia.carouselCards),
      carouselCardsCount: savedMedia.carouselCards?.length || 0
    });

    if (Array.isArray(newData.mediaVariations) && Array.isArray(savedMedia.mediaVariations)) {
      const byId: Record<number, any> = {};
      savedMedia.mediaVariations.forEach((v: MediaVariation) => { if (v?.id != null) byId[v.id] = v; });

      const rehydrated = await Promise.all(newData.mediaVariations.map(async (v: any) => {
        const savedV = byId[v.id];
        const result: any = {
          ...v,
          squareFile: undefined,
          verticalFile: undefined,
          horizontalFile: undefined,
        };

        console.log(`🔄 Processing variation ${v.id}:`, {
          hasSaved: Boolean(savedV),
          squareData: savedV?.square,
          verticalData: savedV?.vertical,
          horizontalData: savedV?.horizontal
        });

        // Helper function to get URL from either string (legacy) or object format
        const getUrlFromSaved = (saved: any) => {
          if (typeof saved === 'string') return saved;
          if (saved && typeof saved === 'object' && saved.url) return saved.url;
          return null;
        };

        // Helper function to normalize saved data to object format
        const normalizeSavedData = (saved: any, defaultName: string) => {
          if (typeof saved === 'string') {
            return {
              url: saved,
              path: `legacy/${Date.now()}`,
              name: defaultName,
              type: 'application/octet-stream',
              size: 0
            };
          }
          return saved;
        };

        // Process square file
        const squareUrl = getUrlFromSaved(savedV?.square);
        if (squareUrl) {
          try {
            const res = await fetch(squareUrl);
            const blob = await res.blob();
            const savedSquareData = normalizeSavedData(savedV.square, `square-${v.id}`);
            const f = new File([blob], savedSquareData.name, { type: blob.type || savedSquareData.type });
            result.squareFile = await validateFile(f, 'square');
            
            // Mark file as from saved source to avoid re-uploading
            if (result.squareFile?.file) {
              Object.defineProperty(result.squareFile.file, '__source_saved_url', {
                value: savedSquareData,
                writable: false,
                enumerable: false
              });
            }
            console.log(`✅ Square file rehydrated for variation ${v.id}`);
          } catch (e) {
            console.warn(`❌ Falha ao reidratar square para variation ${v.id}:`, e);
            hadFailures = true;
          }
        }

        // Process vertical file
        const verticalUrl = getUrlFromSaved(savedV?.vertical);
        if (verticalUrl) {
          try {
            const res = await fetch(verticalUrl);
            const blob = await res.blob();
            const savedVerticalData = normalizeSavedData(savedV.vertical, `vertical-${v.id}`);
            const f = new File([blob], savedVerticalData.name, { type: blob.type || savedVerticalData.type });
            result.verticalFile = await validateFile(f, 'vertical');
            
            // Mark file as from saved source to avoid re-uploading
            if (result.verticalFile?.file) {
              Object.defineProperty(result.verticalFile.file, '__source_saved_url', {
                value: savedVerticalData,
                writable: false,
                enumerable: false
              });
            }
            console.log(`✅ Vertical file rehydrated for variation ${v.id}`);
          } catch (e) {
            console.warn(`❌ Falha ao reidratar vertical para variation ${v.id}:`, e);
            hadFailures = true;
          }
        }

        // Process horizontal file
        const horizontalUrl = getUrlFromSaved(savedV?.horizontal);
        if (horizontalUrl) {
          try {
            const res = await fetch(horizontalUrl);
            const blob = await res.blob();
            const savedHorizontalData = normalizeSavedData(savedV.horizontal, `horizontal-${v.id}`);
            const f = new File([blob], savedHorizontalData.name, { type: blob.type || savedHorizontalData.type });
            result.horizontalFile = await validateFile(f, 'horizontal');
            
            // Mark file as from saved source to avoid re-uploading
            if (result.horizontalFile?.file) {
              Object.defineProperty(result.horizontalFile.file, '__source_saved_url', {
                value: savedHorizontalData,
                writable: false,
                enumerable: false
              });
            }
            console.log(`✅ Horizontal file rehydrated for variation ${v.id}`);
          } catch (e) {
            console.warn(`❌ Falha ao reidratar horizontal para variation ${v.id}:`, e);
            hadFailures = true;
          }
        }

        return result;
      }));

      newData.mediaVariations = rehydrated;
      updateFormData({ mediaVariations: rehydrated });
      console.log(`✅ Rehydrated ${rehydrated.length} media variations`);
    }

    if (Array.isArray(newData.carouselCards) && Array.isArray(savedMedia.carouselCards)) {
      const byId: Record<number, any> = {};
      savedMedia.carouselCards.forEach((c: any) => { if (c?.id != null) byId[c.id] = c; });
      const ratio = (savedMedia.carouselAspectRatio || newData.carouselAspectRatio || '1:1') === '1:1' ? 'carousel-1:1' : 'carousel-4:5';

      const rehydratedCards = await Promise.all(newData.carouselCards.map(async (c: any) => {
        const savedC = byId[c.id];
        const result: any = { ...c, file: undefined };
        
        console.log(`🔄 Processing carousel card ${c.id}:`, {
          hasSaved: Boolean(savedC),
          assetData: savedC?.asset
        });

        // Helper function to get URL from either string (legacy) or object format
        const getAssetUrl = (asset: any) => {
          if (typeof asset === 'string') return asset;
          if (asset && typeof asset === 'object' && asset.url) return asset.url;
          return null;
        };

        // Helper function to normalize asset data to object format
        const normalizeAssetData = (asset: any, defaultName: string) => {
          if (typeof asset === 'string') {
            return {
              url: asset,
              path: `legacy/${Date.now()}`,
              name: defaultName,
              type: 'application/octet-stream',
              size: 0,
              format: 'carousel'
            };
          }
          return asset;
        };

        const assetUrl = getAssetUrl(savedC?.asset);
        if (assetUrl) {
          try {
            const res = await fetch(assetUrl);
            const blob = await res.blob();
            const savedAssetData = normalizeAssetData(savedC.asset, `card-${c.id}`);
            const f = new File([blob], savedAssetData.name, { type: blob.type || savedAssetData.type });
            result.file = await validateFile(f, ratio as any);
            
            // Mark file as from saved source to avoid re-uploading
            if (result.file?.file) {
              Object.defineProperty(result.file.file, '__source_saved_url', {
                value: savedAssetData,
                writable: false,
                enumerable: false
              });
            }
            console.log(`✅ Carousel card ${c.id} rehydrated`);
          } catch (e) {
            console.warn(`❌ Falha ao reidratar cartão ${c.id}:`, e);
            hadFailures = true;
          }
        }
        
        // restore custom fields if present
        if (savedC?.customTitle) result.customTitle = savedC.customTitle;
        if (savedC?.customDescription) result.customDescription = savedC.customDescription;
        if (savedC?.customDestinationUrl) result.customDestinationUrl = savedC.customDestinationUrl;
        if (savedC?.customCta) result.customCta = savedC.customCta;
        return result;
      }));

      newData.carouselCards = rehydratedCards;
      updateFormData({ carouselCards: rehydratedCards, carouselAspectRatio: savedMedia.carouselAspectRatio || newData.carouselAspectRatio });
      console.log(`✅ Rehydrated ${rehydratedCards.length} carousel cards`);
    }

    if (hadFailures) {
      toast({
        title: 'Alguns arquivos não puderam ser reidratados',
        description: 'Eles foram ignorados. Se necessário, reenvie os arquivos.',
      });
    }
  }

  useEffect(() => {
    const loadDraft = async () => {
      if (!routeSubmissionId) return;
      
      setIsLoadingDraft(true);
      try {
        console.log('🔄 Carregando draft:', routeSubmissionId);
        // First try manager actions (for managers)
        let response = await supabase.functions.invoke('j_hub_manager_dashboard', {
          body: { action: 'get', submissionId: routeSubmissionId },
        });
        console.log('📥 Resposta manager_actions:', response);
        
        // If that fails, try admin actions (for admins)
        if (response.error || !response.data?.success) {
          console.log('⚠️ Manager actions falhou, tentando admin actions');
          response = await supabase.functions.invoke('j_hub_admin_dashboard', {
            body: { action: 'getSubmission', submissionId: routeSubmissionId },
          });
          console.log('📥 Resposta admin_actions:', response);
        }
        
        if (response.error || !response.data?.success) {
          toast({ title: 'Falha ao carregar criativo', description: response.data?.error || response.error?.message || 'Tente novamente.', variant: 'destructive' });
          return;
        }
        
        const item = response.data.item;
        console.log('📋 Item carregado:', item);
        if (item?.payload) {
          const payload = { ...item.payload };
          console.log('📦 Payload original:', payload);
          // 1) Ao retomar, mostrar apenas o nome digitado pelo usuário
          if (payload.managerInputName) {
            payload.creativeName = payload.managerInputName;
          }
          console.log('📝 Atualizando formData com:', payload);
          updateFormData(payload);
          // 2) Reidratar arquivos apenas no Step 2 (onde são necessários)
          if (payload.savedMedia && currentStep === 2) {
            await rehydrateFilesFromSavedMedia(payload.savedMedia, payload);
          }
        }
        if (item?.id) {
          setDraftSubmissionId(item.id);
          try { sessionStorage.setItem('draftSubmissionId', item.id); } catch (_) {}
        }
      } catch (e: any) {
        console.error('Erro ao carregar criativo:', e);
        toast({ title: 'Erro ao carregar criativo', description: e?.message || 'Tente novamente.', variant: 'destructive' });
      } finally {
        setIsLoadingDraft(false);
      }
    };
    loadDraft();
  }, [routeSubmissionId]);

  // Reidratar arquivos ao entrar no Step 2
  useEffect(() => {
    const hasSaved = (formData as any)?.savedMedia;
    if (currentStep === 2 && hasSaved && !rehydratedRef.current) {
      rehydratedRef.current = true;
      setIsRehydrating(true);
      (async () => {
        try {
          console.log('🔄 Iniciando reidratação no Step 2...');
          await rehydrateFilesFromSavedMedia((formData as any).savedMedia, formData);
          console.log('✅ Reidratação concluída');
        } catch (e) {
          console.error('❌ Erro na reidratação no Step 2:', e);
        } finally {
          setIsRehydrating(false);
        }
      })();
    }
  }, [currentStep, (formData as any).savedMedia]);

  const nextStep = () => {
    const validationResult = validateStep(currentStep);
    
    if (!validationResult.canProceed) {
      // Erros críticos - bloqueia navegação
      toast({
        title: "Campos obrigatórios",
        description: "Corrija os erros críticos antes de continuar",
        variant: "destructive",
      });
      return;
    }
    
    if (validationResult.hasIssues) {
      // Tem warnings - mostra modal
      setWarningModal({
        isOpen: true,
        step: currentStep,
        validation: validationResult
      });
      return;
    }
    
    // Tudo ok - avança normalmente
    proceedToNextStep();
  };

  const proceedToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
    closeWarningModal();
  };

  const closeWarningModal = () => {
    setWarningModal(null);
  };

  const handleProceedWithWarnings = () => {
    if (warningModal?.validation) {
      // Log que o gerente optou por prosseguir ignorando warnings
      logValidation(warningModal.validation, 'proceeded');
    }
    proceedToNextStep();
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Mostrar modal de confirmação final com resumo dos warnings bypassed
    setFinalSubmissionModal(true);
  };

  const handleConfirmSubmit = () => {
    // Prosseguir com a submissão real
    setFinalSubmissionModal(false);
    const validationSummary = getValidationSummary();
    
    // Incluir warnings bypassados no payload
    const submissionData = {
      ...formData,
      validationOverrides: validationSummary.bypassedWarnings
    };
    
    submitForm(submissionData, validateStep, toast, { submissionId: routeSubmissionId ?? undefined });
  };

  const handleGoBackAndFix = () => {
    setFinalSubmissionModal(false);
    // Opcionalmente, navegar para o primeiro step com problemas
    const validationSummary = getValidationSummary();
    if (validationSummary.stepsWithIssues.length > 0) {
      const firstProblemStep = Math.min(...validationSummary.stepsWithIssues);
      setCurrentStep(firstProblemStep);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.creativeName || !formData.creativeName.trim()) {
      toast({
        title: 'Antes de salvar o rascunho, defina um nome para o Criativo',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para salvar o rascunho.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSavingDraft(true);
      setUploadProgress({ current: 0, total: 0, message: 'Preparando upload...' });

      console.log('💾 Iniciando salvamento de rascunho...');
      console.log('📊 Estado do formData antes do upload:', {
        mediaVariations: formData.mediaVariations?.length || 0,
        carouselCards: (formData as any).carouselCards?.length || 0,
        existingPost: !!(formData as any).existingPost
      });

      // 1) Enviar arquivos para o Storage e montar savedMedia com progresso
      const savedMedia = await buildSavedMedia((current, total, message) => {
        console.log(`📈 Progresso: ${current}/${total} - ${message}`);
        setUploadProgress({ current, total, message });
      });

      console.log('💾 SavedMedia resultante:', {
        mediaVariations: savedMedia.mediaVariations?.length || 0,
        carouselCards: savedMedia.carouselCards?.length || 0,
        totalSize: JSON.stringify(savedMedia).length
      });

      // 2) Montar um payload leve, sem objetos File, para salvar como rascunho
      const draftPayload: any = { ...formData, savedMedia };
      draftPayload.files = [];
      draftPayload.validatedFiles = [];
      if (Array.isArray(draftPayload.mediaVariations)) {
        draftPayload.mediaVariations = draftPayload.mediaVariations.map((v: any) => ({
          id: v.id,
          squareEnabled: v.squareEnabled,
          verticalEnabled: v.verticalEnabled,
          horizontalEnabled: v.horizontalEnabled,
        }));
      }
      if (Array.isArray(draftPayload.carouselCards)) {
        draftPayload.carouselCards = draftPayload.carouselCards.map((c: any) => ({
          id: c.id,
          customTitle: c.customTitle,
          customDescription: c.customDescription,
          customDestinationUrl: c.customDestinationUrl,
          customCta: c.customCta,
        }));
      }

      setUploadProgress({ current: 0, total: 0, message: 'Salvando no servidor...' });
      let response = await supabase.functions.invoke('j_hub_manager_dashboard', {
        body: {
          action: 'saveDraft',
          submissionId: routeSubmissionId ?? undefined,
          draft: draftPayload,
        },
      });

      // If manager endpoint fails, try admin endpoint
      if (response.error || !response.data?.success) {
        response = await supabase.functions.invoke('j_ads_admin_dashboard', {
          body: {
            action: 'saveDraft',
            submissionId: routeSubmissionId ?? undefined,
            draft: draftPayload,
          },
        });
      }

      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.error || 'Falha ao salvar rascunho');
      }

      const data = response.data;

      if (data?.submissionId) {
        setDraftSubmissionId(data.submissionId);
        try { sessionStorage.setItem('draftSubmissionId', data.submissionId); } catch (_) {}
      }

      toast({
        title: 'Rascunho salvo',
        description: data?.creativeName || formData.creativeName || 'Rascunho atualizado.',
      });
    } catch (err) {
      console.error('Erro ao salvar rascunho:', err);
      toast({
        title: 'Erro ao salvar rascunho',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleReset = () => {
    resetForm();
    resetSubmission();
    setCurrentStep(1);
    setDraftSubmissionId(null);
    try { sessionStorage.removeItem('draftSubmissionId'); } catch (_) {}
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          <Success creativeIds={creativeIds} onNewCreative={handleReset} />
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex-1">
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={4} 
          stepLabels={STEP_LABELS} 
        />

        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm mb-6">
          <JumperCardContent className="p-6 md:p-8">
            <Breadcrumbs 
              formData={formData}
              clients={clients}
            />
            
            {currentStep === 1 && (
              <Step1 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors}
                clients={clients}
                clientsLoading={isLoadingClients}
                clientsError={clientsError}
                isAdmin={isAdmin}
                userAccessibleAccounts={userAccessibleAccounts}
              />
            )}
            
            {currentStep === 2 && isRehydrating && (
              <JumperLoadingOverlay message="Carregando mídias salvas..." />
            )}
            
            {currentStep === 2 && !isRehydrating && (
              <Step2 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors} 
              />
            )}
            
            {currentStep === 3 && (
              <Step3 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors} 
              />
            )}
            
            {currentStep === 4 && (
              <Step4 
                formData={formData} 
                isSubmitting={isSubmitting}
                submissionLog={submissionLog}
                submissionError={submissionError}
                lastInvoke={lastInvoke}
                onClearLog={resetSubmissionLog}
              />
            )}
          </JumperCardContent>
        </JumperCard>

        <CreativeNavigation
          currentStep={currentStep}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      </div>
      
      <Footer />
      
      {/* Loading overlay para carregamento inicial de rascunho ou dados do Step 1 */}
      {(isLoadingDraft || (currentStep === 1 && isLoadingClients) || isSavingDraft) && (
        <JumperLoadingOverlay 
          message={
            isLoadingDraft 
              ? "Carregando criativo..." 
              : (currentStep === 1 && isLoadingClients)
                ? "Carregando contas..."
                : uploadProgress.total > 0 
                  ? `${uploadProgress.message} (${uploadProgress.current}/${uploadProgress.total})`
                  : uploadProgress.message || "Salvando rascunho..."
          } 
        />
      )}

      {/* Warning Modal */}
      {warningModal && (
        <WarningModal
          isOpen={warningModal.isOpen}
          onClose={closeWarningModal}
          onProceed={handleProceedWithWarnings}
          onGoBack={closeWarningModal}
          step={warningModal.step}
          warnings={warningModal.validation.warnings}
          criticalErrors={warningModal.validation.criticalErrors}
        />
      )}

      {/* Final Submission Modal */}
      <FinalSubmissionModal
        isOpen={finalSubmissionModal}
        onClose={() => setFinalSubmissionModal(false)}
        onSubmit={handleConfirmSubmit}
        onGoBackAndFix={handleGoBackAndFix}
        bypassedWarnings={getValidationSummary().bypassedWarnings}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CreativeSystem;
