/* eslint-disable react-hooks/exhaustive-deps */
 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, Eye, MousePointer, Users, BarChart3, Clock, Layers, ShoppingCart, Target, Search, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getCTRPerformance,
  getCPMPerformance,
  getCPCPerformance,
  getFrequencyPerformance,
  formatCurrency as formatCurrencyUtil,
  formatPercentage,
  formatNumber as formatNumberUtil
} from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { TopCreativesSection } from './TopCreativesSection';

type DataSource = 'unified' | 'meta' | 'google';

interface MetaMetrics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_link_clicks: number;
  total_reach: number;
  avg_frequency: number;
  avg_cpm: number;
  avg_ctr: number;
  avg_cpc: number;
  days_active: number;
  campaigns_active: number;
  ad_sets_active: number;
}

interface GoogleMetrics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_conversions_value: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  search_impression_share: number;
  search_top_impression_share: number;
  campaigns_active: number;
  ad_groups_active: number;
}

interface UnifiedMetrics {
  total_spend: number;
  meta_spend: number;
  google_spend: number;
  total_sessions: number;
  total_conversions: number;
  total_revenue: number;
  cost_per_session: number;
  conversion_rate: number;
  roas: number;
}

interface AccountInfo {
  id: string;
  name: string;
  metaAdsId?: string;
  id_google_ads?: string;
  id_google_analytics?: string;
}

interface GeneralDashboardProps {
  accountName?: string;
  accountInfo?: AccountInfo;
  selectedPeriod?: number;
}

export function GeneralDashboard({ accountName = 'Account', accountInfo, selectedPeriod = 7 }: GeneralDashboardProps) {
  const [dataSource, setDataSource] = useState<DataSource>('meta');
  const [metaMetrics, setMetaMetrics] = useState<MetaMetrics | null>(null);
  const [googleMetrics, setGoogleMetrics] = useState<GoogleMetrics | null>(null);
  const [unifiedMetrics, setUnifiedMetrics] = useState<UnifiedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range for display
  const endDate = startOfDay(subDays(new Date(), 1));
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1));
  const dateRangeDisplay = `(${format(startDate, 'dd/MM/yy')} a ${format(endDate, 'dd/MM/yy')})`;
  const queryStartDate = format(startDate, 'yyyy-MM-dd');
  const queryEndDate = format(endDate, 'yyyy-MM-dd');

  // Check which sources are available
  const hasMetaAds = !!accountInfo?.metaAdsId;
  const hasGoogleAds = !!accountInfo?.id_google_ads;

  const fetchMetaData = async () => {
    if (!accountInfo?.metaAdsId) return null;

    const { data, error } = await supabase
      .from('j_rep_metaads_bronze')
      .select('*')
      .eq('account_id', accountInfo.metaAdsId)
      .gte('date', queryStartDate)
      .lte('date', queryEndDate);

    if (error) throw new Error(`Meta Ads: ${error.message}`);
    if (!data || data.length === 0) return null;

    const totalSpend = data.reduce((sum, row) => sum + parseFloat(String(row.spend || 0)), 0);
    const totalImpressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const totalClicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalLinkClicks = data.reduce((sum, row) => sum + (row.link_clicks || 0), 0);
    const totalReach = data.reduce((sum, row) => sum + (row.reach || 0), 0);

    return {
      total_spend: totalSpend,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_link_clicks: totalLinkClicks,
      total_reach: totalReach,
      avg_frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      avg_cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      avg_ctr: totalImpressions > 0 ? (totalLinkClicks / totalImpressions) * 100 : 0,
      avg_cpc: totalLinkClicks > 0 ? totalSpend / totalLinkClicks : 0,
      days_active: new Set(data.map(row => row.date)).size,
      campaigns_active: new Set(data.map(row => row.campaign)).size,
      ad_sets_active: new Set(data.map(row => row.adset_name)).size,
    };
  };

  const fetchGoogleData = async () => {
    if (!accountInfo?.id_google_ads) return null;

    const { data, error } = await supabase
      .from('j_rep_googleads_bronze')
      .select('*')
      .eq('account_id', accountInfo.id_google_ads)
      .gte('date', queryStartDate)
      .lte('date', queryEndDate);

    if (error) throw new Error(`Google Ads: ${error.message}`);
    if (!data || data.length === 0) return null;

    const totalSpend = data.reduce((sum, row) => sum + parseFloat(String(row.spend || 0)), 0);
    const totalImpressions = data.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0);
    const totalClicks = data.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0);
    const totalConversions = data.reduce((sum, row) => sum + parseFloat(String(row.conversions || 0)), 0);
    const totalConversionsValue = data.reduce((sum, row) => sum + parseFloat(String(row.conversions_value || 0)), 0);

    // Calculate weighted averages for impression share
    const rowsWithShare = data.filter(row => row.search_impression_share != null);
    const avgSearchShare = rowsWithShare.length > 0
      ? rowsWithShare.reduce((sum, row) => sum + parseFloat(String(row.search_impression_share || 0)), 0) / rowsWithShare.length
      : 0;
    const rowsWithTopShare = data.filter(row => row.search_top_impression_share != null);
    const avgTopShare = rowsWithTopShare.length > 0
      ? rowsWithTopShare.reduce((sum, row) => sum + parseFloat(String(row.search_top_impression_share || 0)), 0) / rowsWithTopShare.length
      : 0;

    return {
      total_spend: totalSpend,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_conversions_value: totalConversionsValue,
      avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avg_cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      search_impression_share: avgSearchShare * 100,
      search_top_impression_share: avgTopShare * 100,
      campaigns_active: new Set(data.map(row => row.campaign)).size,
      ad_groups_active: new Set(data.map(row => row.ad_group_name)).size,
    };
  };

  const fetchGA4Data = async () => {
    if (!accountInfo?.id_google_analytics) return null;

    // GA4 data uses the Google Analytics property ID
    const { data, error } = await supabase
      .from('j_rep_ga4_bronze')
      .select('*')
      .eq('account_id', accountInfo.id_google_analytics)
      .gte('date', queryStartDate)
      .lte('date', queryEndDate);

    if (error) throw new Error(`GA4: ${error.message}`);
    return data || [];
  };

  const fetchUnifiedData = async () => {
    const [metaData, googleData, ga4Data] = await Promise.all([
      fetchMetaData(),
      fetchGoogleData(),
      fetchGA4Data(),
    ]);

    const metaSpend = metaData?.total_spend || 0;
    const googleSpend = googleData?.total_spend || 0;
    const totalSpend = metaSpend + googleSpend;

    // Calculate GA4 metrics
    const totalSessions = ga4Data?.reduce((sum, row) => sum + (Number(row.sessions) || 0), 0) || 0;
    const totalConversions = ga4Data?.reduce((sum, row) => sum + (Number(row.conversions) || 0), 0) || 0;
    const totalRevenue = ga4Data?.reduce((sum, row) => sum + parseFloat(String(row.event_value || 0)), 0) || 0;

    return {
      total_spend: totalSpend,
      meta_spend: metaSpend,
      google_spend: googleSpend,
      total_sessions: totalSessions,
      total_conversions: totalConversions,
      total_revenue: totalRevenue,
      cost_per_session: totalSessions > 0 ? totalSpend / totalSessions : 0,
      conversion_rate: totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (dataSource === 'meta') {
        if (!hasMetaAds) {
          throw new Error('ID Meta Ads não configurado para esta conta');
        }
        const data = await fetchMetaData();
        if (!data) throw new Error('Nenhum dado encontrado no Meta Ads');
        setMetaMetrics(data);
      } else if (dataSource === 'google') {
        if (!hasGoogleAds) {
          throw new Error('ID Google Ads não configurado para esta conta');
        }
        const data = await fetchGoogleData();
        if (!data) throw new Error('Nenhum dado encontrado no Google Ads');
        setGoogleMetrics(data);
      } else {
        const data = await fetchUnifiedData();
        setUnifiedMetrics(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('General dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    fetchData();
  }, [accountInfo?.metaAdsId, accountInfo?.id_google_ads, selectedPeriod, dataSource]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  const formatPct = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Source selector buttons
  const SourceSelector = () => (
    <div className="flex gap-2">
      <Button
        variant={dataSource === 'unified' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDataSource('unified')}
        className={dataSource === 'unified' ? 'bg-gradient-to-r from-blue-500 to-green-500' : ''}
      >
        <Layers className="h-4 w-4 mr-2" />
        Unificado
      </Button>
      <Button
        variant={dataSource === 'meta' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDataSource('meta')}
        disabled={!hasMetaAds}
        className={dataSource === 'meta' ? 'bg-blue-600 hover:bg-blue-700' : ''}
      >
        Meta Ads
        {!hasMetaAds && <Badge variant="secondary" className="ml-2 text-xs">N/A</Badge>}
      </Button>
      <Button
        variant={dataSource === 'google' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDataSource('google')}
        disabled={!hasGoogleAds}
        className={dataSource === 'google' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        Google Ads
        {!hasGoogleAds && <Badge variant="secondary" className="ml-2 text-xs">N/A</Badge>}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral da Conta</h2>
          </div>
          <SourceSelector />
        </div>
        <SkeletonDashboard cardCount={4} heroCards={1} showHeader={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral da Conta</h2>
            <p className="text-muted-foreground">
              Últimos {selectedPeriod} dias {dateRangeDisplay}
            </p>
          </div>
          <SourceSelector />
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchData}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Unified View
  if (dataSource === 'unified' && unifiedMetrics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral Unificada</h2>
            <p className="text-muted-foreground">
              Meta Ads + Google Ads + GA4 - Últimos {selectedPeriod} dias {dateRangeDisplay}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SourceSelector />
            <Button onClick={fetchData} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Investimento Total"
            value={formatCurrency(unifiedMetrics.total_spend)}
            subtitle={`Meta: ${formatCurrency(unifiedMetrics.meta_spend)} | Google: ${formatCurrency(unifiedMetrics.google_spend)}`}
            icon={DollarSign}
            performance="neutral"
            isHero={true}
          />

          <MetricCard
            title="Sessões (GA4)"
            value={formatNumber(unifiedMetrics.total_sessions)}
            subtitle={`Custo/Sessão: ${formatCurrency(unifiedMetrics.cost_per_session)}`}
            icon={Users}
            performance={unifiedMetrics.cost_per_session < 5 ? 'excellent' : unifiedMetrics.cost_per_session < 10 ? 'good' : 'warning'}
          />

          <MetricCard
            title="Taxa de Conversão"
            value={formatPct(unifiedMetrics.conversion_rate)}
            subtitle={`${formatNumber(unifiedMetrics.total_conversions)} conversões`}
            icon={Target}
            performance={unifiedMetrics.conversion_rate >= 3 ? 'excellent' : unifiedMetrics.conversion_rate >= 1 ? 'good' : 'warning'}
          />

          <MetricCard
            title="ROAS GA4"
            value={unifiedMetrics.roas.toFixed(2)}
            subtitle={formatCurrency(unifiedMetrics.total_revenue)}
            icon={TrendingUp}
            performance={unifiedMetrics.roas >= 3 ? 'excellent' : unifiedMetrics.roas >= 2 ? 'good' : 'warning'}
          />
        </div>

        {/* Spend Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Investimento</CardTitle>
            <CardDescription>Comparativo entre plataformas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Meta Ads</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{formatCurrency(unifiedMetrics.meta_spend)}</span>
                  <Badge variant="outline">
                    {unifiedMetrics.total_spend > 0
                      ? `${((unifiedMetrics.meta_spend / unifiedMetrics.total_spend) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${unifiedMetrics.total_spend > 0
                      ? (unifiedMetrics.meta_spend / unifiedMetrics.total_spend) * 100
                      : 0}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Google Ads</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{formatCurrency(unifiedMetrics.google_spend)}</span>
                  <Badge variant="outline">
                    {unifiedMetrics.total_spend > 0
                      ? `${((unifiedMetrics.google_spend / unifiedMetrics.total_spend) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${unifiedMetrics.total_spend > 0
                      ? (unifiedMetrics.google_spend / unifiedMetrics.total_spend) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Google Ads View
  if (dataSource === 'google' && googleMetrics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral - Google Ads</h2>
            <p className="text-muted-foreground">
              Últimos {selectedPeriod} dias {dateRangeDisplay}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SourceSelector />
            <Button onClick={fetchData} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Investimento Total"
            value={formatCurrency(googleMetrics.total_spend)}
            subtitle={`${googleMetrics.campaigns_active} campanhas ativas`}
            icon={DollarSign}
            performance="neutral"
            isHero={true}
          />

          <MetricCard
            title="Impressões"
            value={formatNumber(googleMetrics.total_impressions)}
            subtitle={`CPM: ${formatCurrency(googleMetrics.avg_cpm)}`}
            icon={Eye}
            performance={getCPMPerformance(googleMetrics.avg_cpm)}
          />

          <MetricCard
            title="Cliques"
            value={formatNumber(googleMetrics.total_clicks)}
            subtitle={`CPC: ${formatCurrency(googleMetrics.avg_cpc)}`}
            icon={MousePointer}
            performance={getCPCPerformance(googleMetrics.avg_cpc)}
          />

          <MetricCard
            title="CTR"
            value={formatPct(googleMetrics.avg_ctr)}
            subtitle="Taxa de cliques"
            icon={BarChart3}
            performance={getCTRPerformance(googleMetrics.avg_ctr)}
          />
        </div>

        {/* Google Ads Specific Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(googleMetrics.total_conversions)}</div>
              <p className="text-xs text-muted-foreground">
                Valor: {formatCurrency(googleMetrics.total_conversions_value)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {googleMetrics.total_spend > 0
                  ? (googleMetrics.total_conversions_value / googleMetrics.total_spend).toFixed(2)
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Retorno sobre investimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imp. Share</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPct(googleMetrics.search_impression_share)}</div>
              <p className="text-xs text-muted-foreground">
                Parcela de impressões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Share</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPct(googleMetrics.search_top_impression_share)}</div>
              <p className="text-xs text-muted-foreground">
                Topo da busca
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render Meta Ads View (default)
  if (dataSource === 'meta' && metaMetrics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral - Meta Ads</h2>
            <p className="text-muted-foreground">
              Últimos {selectedPeriod} dias {dateRangeDisplay}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SourceSelector />
            <Button onClick={fetchData} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Investimento Total"
            value={formatCurrency(metaMetrics.total_spend)}
            subtitle={`${metaMetrics.campaigns_active} campanhas ativas`}
            icon={DollarSign}
            performance="neutral"
            isHero={true}
          />

          <MetricCard
            title="Impressões"
            value={formatNumber(metaMetrics.total_impressions)}
            subtitle={`CPM: ${formatCurrency(metaMetrics.avg_cpm)}`}
            icon={Eye}
            performance={getCPMPerformance(metaMetrics.avg_cpm)}
          />

          <MetricCard
            title="Cliques no Link"
            value={formatNumber(metaMetrics.total_link_clicks)}
            subtitle={`CPC: ${formatCurrency(metaMetrics.avg_cpc)}`}
            icon={MousePointer}
            performance={getCPCPerformance(metaMetrics.avg_cpc)}
          />

          <MetricCard
            title="CTR (Link)"
            value={formatPct(metaMetrics.avg_ctr)}
            subtitle="Taxa de cliques no link"
            icon={BarChart3}
            performance={getCTRPerformance(metaMetrics.avg_ctr)}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alcance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metaMetrics.total_reach)}</div>
              <p className="text-xs text-muted-foreground">Pessoas alcançadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frequência</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metaMetrics.avg_frequency.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Impressões por pessoa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estrutura</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metaMetrics.ad_sets_active}</div>
              <p className="text-xs text-muted-foreground">Conjuntos de anúncios ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Creatives Section */}
        <TopCreativesSection
          accountId={accountInfo?.metaAdsId || null}
          objective="geral"
          dateStart={startDate}
          dateEnd={endDate}
        />
      </div>
    );
  }

  // Fallback if no data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral da Conta</h2>
        </div>
        <SourceSelector />
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum dado encontrado para {accountInfo?.name || accountName}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
