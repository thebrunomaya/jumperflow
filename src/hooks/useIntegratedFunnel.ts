/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export interface FunnelData {
  date: string;
  account_id: string;
  account_name: string;
  campaign_id: string;
  campaign: string;
  spend: number;
  impressions: number;
  link_clicks: number;
  reach: number;
  sessions: number | null;
  engaged_sessions: number | null;
  active_users: number | null;
  ga4_conversions: number | null;
  ga4_revenue: number | null;
  meta_conversions: number | null;
  meta_revenue: number | null;
  custo_por_sessao: number | null;
  taxa_chegada: number | null;
  taxa_engajamento: number | null;
  taxa_conversao_ga4: number | null;
  cpa_ga4: number | null;
  roas_ga4: number | null;
}

export interface FunnelSummary {
  total_spend: number;
  total_impressions: number;
  total_link_clicks: number;
  total_sessions: number;
  total_engaged_sessions: number;
  total_ga4_conversions: number;
  total_ga4_revenue: number;
  total_meta_conversions: number;
  total_meta_revenue: number;
  avg_taxa_chegada: number;
  avg_taxa_engajamento: number;
  avg_roas_ga4: number;
  avg_roas_meta: number;
}

interface UseIntegratedFunnelResult {
  data: FunnelData[];
  summary: FunnelSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIntegratedFunnel(
  accountId: string | null,
  selectedPeriod: number = 7
): UseIntegratedFunnelResult {
  const [data, setData] = useState<FunnelData[]>([]);
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endDate = startOfDay(subDays(new Date(), 1));
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1));

  const fetchData = async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: funnelData, error: queryError } = await supabase
        .from('v_meta_ga4_campaign_funnel')
        .select('*')
        .eq('account_id', accountId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('spend', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const typedData: FunnelData[] = (funnelData || []).map((row: Record<string, unknown>) => ({
        date: String(row.date || ''),
        account_id: String(row.account_id || ''),
        account_name: String(row.account_name || ''),
        campaign_id: String(row.campaign_id || ''),
        campaign: String(row.campaign || ''),
        spend: Number(row.spend) || 0,
        impressions: Number(row.impressions) || 0,
        link_clicks: Number(row.link_clicks) || 0,
        reach: Number(row.reach) || 0,
        sessions: row.sessions != null ? Number(row.sessions) : null,
        engaged_sessions: row.engaged_sessions != null ? Number(row.engaged_sessions) : null,
        active_users: row.active_users != null ? Number(row.active_users) : null,
        ga4_conversions: row.ga4_conversions != null ? Number(row.ga4_conversions) : null,
        ga4_revenue: row.ga4_revenue != null ? Number(row.ga4_revenue) : null,
        meta_conversions: row.meta_conversions != null ? Number(row.meta_conversions) : null,
        meta_revenue: row.meta_revenue != null ? Number(row.meta_revenue) : null,
        custo_por_sessao: row.custo_por_sessao != null ? Number(row.custo_por_sessao) : null,
        taxa_chegada: row.taxa_chegada != null ? Number(row.taxa_chegada) : null,
        taxa_engajamento: row.taxa_engajamento != null ? Number(row.taxa_engajamento) : null,
        taxa_conversao_ga4: row.taxa_conversao_ga4 != null ? Number(row.taxa_conversao_ga4) : null,
        cpa_ga4: row.cpa_ga4 != null ? Number(row.cpa_ga4) : null,
        roas_ga4: row.roas_ga4 != null ? Number(row.roas_ga4) : null,
      }));

      setData(typedData);

      // Calculate summary
      if (typedData.length > 0) {
        const total_spend = typedData.reduce((sum, row) => sum + row.spend, 0);
        const total_impressions = typedData.reduce((sum, row) => sum + row.impressions, 0);
        const total_link_clicks = typedData.reduce((sum, row) => sum + row.link_clicks, 0);
        const total_sessions = typedData.reduce((sum, row) => sum + (row.sessions || 0), 0);
        const total_engaged_sessions = typedData.reduce((sum, row) => sum + (row.engaged_sessions || 0), 0);
        const total_ga4_conversions = typedData.reduce((sum, row) => sum + (row.ga4_conversions || 0), 0);
        const total_ga4_revenue = typedData.reduce((sum, row) => sum + (row.ga4_revenue || 0), 0);
        const total_meta_conversions = typedData.reduce((sum, row) => sum + (row.meta_conversions || 0), 0);
        const total_meta_revenue = typedData.reduce((sum, row) => sum + (row.meta_revenue || 0), 0);

        setSummary({
          total_spend,
          total_impressions,
          total_link_clicks,
          total_sessions,
          total_engaged_sessions,
          total_ga4_conversions,
          total_ga4_revenue,
          total_meta_conversions,
          total_meta_revenue,
          avg_taxa_chegada: total_link_clicks > 0 ? (total_sessions / total_link_clicks) * 100 : 0,
          avg_taxa_engajamento: total_sessions > 0 ? (total_engaged_sessions / total_sessions) * 100 : 0,
          avg_roas_ga4: total_spend > 0 ? total_ga4_revenue / total_spend : 0,
          avg_roas_meta: total_spend > 0 ? total_meta_revenue / total_spend : 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do funil');
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    fetchData();
  }, [accountId, selectedPeriod]);

  return { data, summary, loading, error, refetch: fetchData };
}
