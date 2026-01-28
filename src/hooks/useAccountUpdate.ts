/**
 * useAccountUpdate - Hook for updating account data via Edge Function
 * Updates both Notion and Supabase in a single call
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccountUpdates {
  Conta?: string;
  Status?: string;
  Tier?: number;
  Objetivos?: string[];
  Nicho?: string[];
  // Team fields - array of user UUIDs (resolved to Notion user IDs on backend)
  Gestor_user_ids?: string[];
  Atendimento_user_ids?: string[];
  "ID Meta Ads"?: string;
  "ID Google Ads"?: string;
  "ID Tiktok Ads"?: string;
  "ID Google Analytics"?: string;
  "Contexto para Otimizacao"?: string;
  "Contexto para Transcricao"?: string;
  "Metodo de Pagamento"?: string;
  "META: Verba Mensal"?: string;
  "G-ADS: Verba Mensal"?: string;
  "Woo Site URL"?: string;
  "Woo Consumer Key"?: string;
  "Woo Consumer Secret"?: string;
  // Report configuration
  report_enabled?: boolean;
  report_roas_target?: number | string;
  report_cpa_max?: number | string;
  report_conv_min?: number | string;
  report_daily_target?: number | string;
  report_whatsapp_numbers?: string[];
}

interface UpdateResult {
  success: boolean;
  updated_fields?: string[];
  account_name?: string;
  error?: string;
}

export function useAccountUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateAccount = async (accountId: string, updates: AccountUpdates): Promise<UpdateResult> => {
    setIsUpdating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<UpdateResult>(
        'j_hub_account_update',
        { body: { account_id: accountId, updates } }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to call update function');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Update failed');
      }

      toast({
        title: "Conta atualizada",
        description: `${data.account_name || 'Conta'} foi atualizada com sucesso.`,
      });

      return data;
    } catch (err) {
      const message = err.message || 'Erro ao atualizar conta';
      setError(message);
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateAccount, isUpdating, error };
}
