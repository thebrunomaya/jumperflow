/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
import { FormData } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { JumperInput } from '@/components/ui/jumper-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { validateCreativeName, previewCreativeNameDetailed, getObjectiveCode, getTypeCode } from '@/utils/creativeName';
import { organizeClientAccounts } from '@/utils/accountUtils';
import { supabase } from '@/integrations/supabase/client';
import facebookLogo from '@/assets/facebook-logo.svg';
import googleGLogo from '@/assets/google-g-logo.svg';

interface Step1Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
  clients: Array<{ id: string; name: string; objectives?: string[] }>;
  clientsLoading: boolean;
  clientsError: string | null;
  isAdmin: boolean;
  userAccessibleAccounts: string[];
}

const Step1: React.FC<Step1Props> = ({ 
  formData, 
  updateFormData, 
  errors, 
  clients, 
  clientsLoading, 
  clientsError, 
  isAdmin, 
  userAccessibleAccounts 
}) => {

  // Get selected client data to access objectives
  const selectedClient = clients.find(client => client.id === formData.client);
  const availableObjectives = selectedClient?.objectives || [];

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
  // Check if all prerequisites for creative name are filled
  const canShowCreativeName = !!(
    formData.client && 
    formData.platform && 
    formData.campaignObjective && 
    (formData.platform === 'google' || formData.creativeType) // For Google, creativeType is not required
  );

  // Handle creative name change replacing spaces with underscores
  const handleCreativeNameChange = (value: string) => {
    const cleanValue = value.replace(/\s+/g, '_');
    updateFormData({ creativeName: cleanValue });
  };

  // Memoizar a ordenação das contas para evitar re-renders desnecessários
  const sortedClients = useMemo(() => 
    organizeClientAccounts(clients, userAccessibleAccounts), 
    [clients, userAccessibleAccounts]
  );

  // Generate detailed preview name if all required fields are filled
  const detailedPreviewName = useMemo(() => {
    if (
      formData.creativeName && 
      formData.campaignObjective && 
      formData.creativeType && 
      selectedClient
    ) {
      // If we have the real account code, compute an accurate preview aligned with backend
      if (accountCode) {
        const obj = getObjectiveCode(formData.campaignObjective);
        const type = getTypeCode(formData.creativeType);
        return `JSC-XXX_${formData.creativeName}_${obj}_${type}_${accountCode}`;
      }
      // Fallback to previous preview (with #XXX)
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        formData.creativeType,
        selectedClient.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, selectedClient, accountCode]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📋 Informações Básicas</h2>
        <p className="text-muted-foreground">Vamos começar com os dados essenciais do seu criativo</p>
      </div>

      {/* Conta - agora ocupando mais espaço */}
      <div className="space-y-2">
        <Label htmlFor="client" className="text-sm font-medium text-foreground">
          Conta *
        </Label>
        {clientsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <div className="text-xs text-muted-foreground animate-pulse">
              Carregando contas...
            </div>
          </div>
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}>
            <SelectTrigger className={`h-12 ${errors.client ? 'border-destructive bg-destructive/10' : ''}`}>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent 
              side="bottom" 
              align="start" 
              avoidCollisions={false}
              sticky="always"
              className="!transform-none"
              style={{ top: '100%', bottom: 'auto' }}
            >
              {/* Seção: Minhas Contas (contas vinculadas do usuário) */}
              {isAdmin && sortedClients.sortedNormalAccounts.length > 0 && (
                <div className="px-2 py-1 bg-green-50 border-l-2 border-green-500">
                  <div className="text-xs font-medium text-green-700">📋 Minhas Contas</div>
                </div>
              )}
              {sortedClients.sortedNormalAccounts.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {client.name}
                    {isAdmin && <span className="ml-auto text-xs text-green-600">Vinculada</span>}
                  </span>
                </SelectItem>
              ))}
              
              {/* Seção: Outras Contas (apenas admin) */}
              {isAdmin && sortedClients.sortedAdminOnlyAccounts.length > 0 && (
                <>
                  {sortedClients.sortedNormalAccounts.length > 0 && (
                    <div className="px-2 py-1">
                      <div className="h-px bg-border"></div>
                    </div>
                  )}
                  <div className="px-2 py-1 bg-orange-50 border-l-2 border-orange-500">
                    <div className="text-xs font-medium text-orange-700">⚙️ Outras Contas (Admin)</div>
                  </div>
                  {sortedClients.sortedAdminOnlyAccounts.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex items-center text-muted-foreground">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        {client.name}
                        <span className="ml-auto text-xs text-orange-600">Admin</span>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        )}
        {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
        {clientsError && <p className="text-sm text-yellow-600">⚠️ {clientsError} (usando dados locais)</p>}
      </div>

      {/* Plataforma */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Plataforma *</Label>
        <div className="grid grid-cols-2 gap-4">
          <JumperCard 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'meta' 
                ? 'border-2 border-accent-subtle bg-accent-subtle/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'meta', campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}
          >
            <JumperCardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img src={facebookLogo} alt="Facebook" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground">Meta Ads</h3>
              <p className="text-sm text-muted-foreground mt-1">Facebook & Instagram</p>
            </JumperCardContent>
          </JumperCard>
          
          <JumperCard 
            className="cursor-not-allowed transition-all duration-200 opacity-50 relative"
          >
            <JumperCardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img src={googleGLogo} alt="Google" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Google Ads</h3>
              <p className="text-sm text-muted-foreground mt-1">Search & Display</p>
              <Badge
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-xs px-2 py-1 shadow-sm border border-border"
              >
                Em Breve
              </Badge>
            </JumperCardContent>
          </JumperCard>
        </div>
        {errors.platform && <p className="text-sm text-red-500">{errors.platform}</p>}
      </div>

      {/* Fields specific to when platform is selected */}
      {(formData.platform === 'meta' || formData.platform === 'google') && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Objetivo de Campanha */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Objetivo de Campanha *</Label>
            <Select 
              value={formData.campaignObjective || ''} 
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined, creativeName: '' })}
              disabled={!formData.client}
            >
              <SelectTrigger className={`h-12 ${errors.campaignObjective ? 'border-destructive bg-destructive/10' : ''}`}>
                <SelectValue placeholder={!formData.client ? "Selecione uma conta primeiro" : "Selecione o objetivo"} />
              </SelectTrigger>
              <SelectContent>
                {availableObjectives.map((objective) => (
                  <SelectItem key={objective} value={objective}>
                    {objective}
                  </SelectItem>
                ))}
                {availableObjectives.length === 0 && formData.client && (
                  <SelectItem value="no-objectives" disabled>
                    Nenhum objetivo disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.campaignObjective && <p className="text-sm text-red-500">{errors.campaignObjective}</p>}
          </div>

          {/* Tipo de Anúncio - only for Meta Ads and only after campaign objective is selected */}
          {formData.platform === 'meta' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tipo de Anúncio *</Label>
              <Select 
                value={formData.creativeType || ''} 
                onValueChange={(value) => updateFormData({ creativeType: value as any, creativeName: '' })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`h-12 ${errors.creativeType ? 'border-destructive bg-destructive/10' : ''}`}>
                  <SelectValue placeholder={!formData.campaignObjective ? "Selecione o objetivo primeiro" : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">🖼️ Imagem/Vídeo Único</SelectItem>
                  <SelectItem value="carousel">🎠 Carrossel</SelectItem>
                  <SelectItem value="collection" disabled className="opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-400">🏪 Coleção</span>
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs border-gray-200 text-gray-500 bg-gray-50"
                      >
                        Em Breve
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="existing-post">📱 Publicação Existente</SelectItem>
                </SelectContent>
              </Select>
              {errors.creativeType && <p className="text-sm text-red-500">{errors.creativeType}</p>}
            </div>
          )}
        </div>
      )}

      {/* Nome do Criativo - só aparece quando todos os pré-requisitos estão preenchidos */}
      {canShowCreativeName && (
        <div className="space-y-2 animate-fade-in">
          <JumperInput
            label="Nome do Criativo *"
            value={formData.creativeName || ''}
            onChange={handleCreativeNameChange}
            placeholder="Ex: Ronaldo, BlackFridayDesc50"
            error={errors.creativeName}
            className="h-12"
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Máximo 20 caracteres • Sem espaços • Apenas letras, números e _
            </div>
            <div className="text-xs text-jumper-orange">
              {formData.creativeName?.length || 0}/20 caracteres
            </div>
          </div>
          
          {/* Preview detalhado do nome final */}
          {detailedPreviewName && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-2">🎯 Preview do Nome Final:</p>
              <p className="text-sm font-mono text-green-700 break-all bg-card px-3 py-2 rounded border border-green-200">
                {detailedPreviewName}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Este será o nome usado no Facebook Ads Manager e no Notion
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1;
