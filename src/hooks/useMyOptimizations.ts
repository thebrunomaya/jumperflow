/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Complete optimization data with account info and extract
 */
export interface OptimizationWithDetails {
  id: string;
  recording_id: string;
  account_id: string;
  account_name: string;
  recorded_at: string;
  recorded_by: string;
  extract_text: string | null;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  duration_seconds: number | null;
}

/**
 * Hook to fetch all optimizations from accounts the user has access to
 * Uses same permission logic as /my-accounts (via j_hub_user_accounts edge function)
 */
export const useMyOptimizations = () => {
  const [optimizations, setOptimizations] = useState<OptimizationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptimizations = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get user's accessible account IDs
        const { data: accountsData, error: accountsError } = await supabase.functions.invoke('j_hub_user_accounts');

        if (accountsError) throw accountsError;
        if (!accountsData || accountsData.success !== true) {
          throw new Error(accountsData?.error || 'Resposta inválida ao buscar contas');
        }

        // Use account_ids (UUIDs) for modern j_hub_optimization_recordings table
        // After migration, account_uuid column references j_hub_notion_db_accounts(id)
        const accountIds = Array.isArray(accountsData.account_ids)
          ? accountsData.account_ids
          : [];

        // Map by UUID for name resolution
        const accountsMap = new Map(
          (accountsData.accounts || []).map((acc: any) => [acc.id, acc.name])
        );

        if (accountIds.length === 0) {
          setOptimizations([]);
          return;
        }

        // 2. Fetch optimizations with extracts and recordings for these accounts
        const { data: optimizationsData, error: optimizationsError } = await supabase
          .from('j_hub_optimization_recordings')
          .select(`
            id,
            account_id,
            recorded_at,
            recorded_by,
            transcription_status,
            analysis_status,
            duration_seconds,
            j_hub_optimization_extracts!left(
              extract_text
            )
          `)
          .in('account_id', accountIds)
          .order('recorded_at', { ascending: false });

        if (optimizationsError) throw optimizationsError;

        // 3. Transform data
        const transformed: OptimizationWithDetails[] = (optimizationsData || []).map((rec: any) => ({
          id: rec.id,
          recording_id: rec.id,
          account_id: rec.account_id,
          account_name: accountsMap.get(rec.account_id) || rec.account_id,
          recorded_at: rec.recorded_at,
          recorded_by: rec.recorded_by,
          extract_text: rec.j_hub_optimization_extracts?.extract_text || null,
          transcription_status: rec.transcription_status,
          analysis_status: rec.analysis_status,
          duration_seconds: rec.duration_seconds,
        }));

        setOptimizations(transformed);

      } catch (err) {
        console.error('useMyOptimizations error:', err);
        setError(err?.message || 'Falha ao carregar otimizações');
        setOptimizations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, []);

  return {
    optimizations,
    loading,
    error,
  };
};
