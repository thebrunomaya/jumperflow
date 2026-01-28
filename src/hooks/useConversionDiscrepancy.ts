/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export interface DiscrepancyData {
  date: string;
  account_id: string;
  account_name: string;
  campaign: string;
  spend: number;
  meta_conversions: number;
  ga4_conversions: number;
  discrepancy: number;
  discrepancy_pct: number;
  meta_revenue: number;
  ga4_revenue: number;
  roas_meta: number | null;
  roas_ga4: number | null;
}

export interface DiscrepancySummary {
  total_spend: number;
  total_meta_conversions: number;
  total_ga4_conversions: number;
  total_discrepancy: number;
  avg_discrepancy_pct: number;
  total_meta_revenue: number;
  total_ga4_revenue: number;
  campaigns_with_high_discrepancy: number;
}

interface UseConversionDiscrepancyResult {
  data: DiscrepancyData[];
  summary: DiscrepancySummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useConversionDiscrepancy(
  accountId: string | null,
  selectedPeriod: number = 7
): UseConversionDiscrepancyResult {
  const [data, setData] = useState<DiscrepancyData[]>([]);
  const [summary, setSummary] = useState<DiscrepancySummary | null>(null);
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

      const { data: discrepancyData, error: queryError } = await supabase
        .from('v_conversion_discrepancy')
        .select('*')
        .eq('account_id', accountId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('discrepancy_pct', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const typedData: DiscrepancyData[] = (discrepancyData || []).map((row: Record<string, unknown>) => ({
        date: String(row.date || ''),
        account_id: String(row.account_id || ''),
        account_name: String(row.account_name || ''),
        campaign: String(row.campaign || ''),
        spend: Number(row.spend) || 0,
        meta_conversions: Number(row.meta_conversions) || 0,
        ga4_conversions: Number(row.ga4_conversions) || 0,
        discrepancy: Number(row.discrepancy) || 0,
        discrepancy_pct: Number(row.discrepancy_pct) || 0,
        meta_revenue: Number(row.meta_revenue) || 0,
        ga4_revenue: Number(row.ga4_revenue) || 0,
        roas_meta: row.roas_meta != null ? Number(row.roas_meta) : null,
        roas_ga4: row.roas_ga4 != null ? Number(row.roas_ga4) : null,
      }));

      setData(typedData);

      // Calculate summary
      if (typedData.length > 0) {
        const total_spend = typedData.reduce((sum, row) => sum + row.spend, 0);
        const total_meta_conversions = typedData.reduce((sum, row) => sum + row.meta_conversions, 0);
        const total_ga4_conversions = typedData.reduce((sum, row) => sum + row.ga4_conversions, 0);
        const total_discrepancy = total_meta_conversions - total_ga4_conversions;
        const total_meta_revenue = typedData.reduce((sum, row) => sum + row.meta_revenue, 0);
        const total_ga4_revenue = typedData.reduce((sum, row) => sum + row.ga4_revenue, 0);
        const campaigns_with_high_discrepancy = typedData.filter(row => Math.abs(row.discrepancy_pct) > 30).length;

        setSummary({
          total_spend,
          total_meta_conversions,
          total_ga4_conversions,
          total_discrepancy,
          avg_discrepancy_pct: total_meta_conversions > 0
            ? ((total_meta_conversions - total_ga4_conversions) / total_meta_conversions) * 100
            : 0,
          total_meta_revenue,
          total_ga4_revenue,
          campaigns_with_high_discrepancy,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de discrepância');
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    fetchData();
  }, [accountId, selectedPeriod]);

  return { data, summary, loading, error, refetch: fetchData };
}
