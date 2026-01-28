/* eslint-disable react-hooks/exhaustive-deps */
 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, ShoppingCart, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  total_spend: string;
  total_impressions: number;
  total_clicks: number;
  total_purchases: number;
  total_add_to_cart: number;
  total_checkout: number;
  total_view_content: number;
  total_revenue: string;
  avg_ctr: string;
  avg_cpa: string;
  conversion_rate: string;
  roas: string;
  days_active: number;
  campaigns_active: number;
  total_ads: number;
}

interface DailyMetrics {
  date: string;
  spend: string;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: string;
}

interface CampaignMetrics {
  campaign: string;
  spend: string;
  impressions: number;
  clicks: number;
  purchases: number;
  ctr: string;
  conversion_rate: string;
}

interface BoilerDashboardProps {
  accountName?: string;
}

export function BoilerDashboard({ accountName = 'BOILER 2.0' }: BoilerDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw data first
      const { data: rawData, error: rawError } = await supabase
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_name', accountName)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (rawError) throw rawError;
      
      // Calculate metrics client-side
      if (rawData && rawData.length > 0) {
        const totalSpend = rawData.reduce((sum, row) => sum + parseFloat(String(row.spend || 0)), 0);
        const totalImpressions = rawData.reduce((sum, row) => sum + (row.impressions || 0), 0);
        const totalClicks = rawData.reduce((sum, row) => sum + (row.clicks || 0), 0);
        const totalPurchases = rawData.reduce((sum, row) => sum + (row.actions_purchase || 0), 0);
        const totalAddToCart = rawData.reduce((sum, row) => sum + (row.actions_add_to_cart || 0), 0);
        const totalCheckout = rawData.reduce((sum, row) => sum + (row.actions_initiate_checkout || 0), 0);
        const totalViewContent = rawData.reduce((sum, row) => sum + (row.actions_view_content || 0), 0);
        const totalRevenue = rawData.reduce((sum, row) => sum + parseFloat(String(row.action_values_omni_purchase || 0)), 0);

        const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
        const avgCpa = totalPurchases > 0 ? (totalSpend / totalPurchases).toFixed(2) : null;
        const conversionRate = totalClicks > 0 ? ((totalPurchases / totalClicks) * 100).toFixed(2) : '0';
        const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0';

        const uniqueDates = new Set(rawData.map(row => row.date)).size;
        const uniqueCampaigns = new Set(rawData.map(row => row.campaign)).size;

        setMetrics({
          total_spend: totalSpend.toFixed(2),
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_purchases: totalPurchases,
          total_add_to_cart: totalAddToCart,
          total_checkout: totalCheckout,
          total_view_content: totalViewContent,
          total_revenue: totalRevenue.toFixed(2),
          avg_ctr: avgCtr,
          avg_cpa: avgCpa,
          conversion_rate: conversionRate,
          roas: roas,
          days_active: uniqueDates,
          campaigns_active: uniqueCampaigns,
          total_ads: rawData.length
        });
      }

      // Process daily data
      const dailyMap = new Map();
      rawData?.forEach(row => {
        const date = row.date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            spend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0,
            revenue: 0
          });
        }
        const day = dailyMap.get(date);
        day.spend += parseFloat(String(row.spend || 0));
        day.impressions += row.impressions || 0;
        day.clicks += row.clicks || 0;
        day.purchases += row.actions_purchase || 0;
        day.revenue += parseFloat(String(row.action_values_omni_purchase || 0));
      });

      const dailyArray = Array.from(dailyMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(day => ({
          ...day,
          spend: day.spend.toFixed(2),
          revenue: day.revenue.toFixed(2)
        }));
      
      setDailyData(dailyArray);

      // Process campaign data
      const campaignMap = new Map();
      rawData?.forEach(row => {
        const campaign = row.campaign;
        if (!campaignMap.has(campaign)) {
          campaignMap.set(campaign, {
            campaign,
            spend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0
          });
        }
        const camp = campaignMap.get(campaign);
        camp.spend += parseFloat(String(row.spend || 0));
        camp.impressions += row.impressions || 0;
        camp.clicks += row.clicks || 0;
        camp.purchases += row.actions_purchase || 0;
      });

      const campaignArray = Array.from(campaignMap.values())
        .map(camp => ({
          ...camp,
          spend: camp.spend.toFixed(2),
          ctr: camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : '0',
          conversion_rate: camp.clicks > 0 ? ((camp.purchases / camp.clicks) * 100).toFixed(2) : '0'
        }))
        .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend));
      
      setCampaignData(campaignArray);

    } catch (err) {
      setError(err.message);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados: {error}</p>
          <Button onClick={fetchData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Nenhum dado encontrado para BOILER 2.0</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard BOILER 2.0</h1>
          <p className="text-muted-foreground">Métricas de E-commerce - Últimos 7 dias</p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              ROAS: {metrics.roas}x
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_spend)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.campaigns_active} campanhas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_purchases}</div>
            <p className="text-xs text-muted-foreground">
              CPA: {formatCurrency(metrics.avg_cpa || '0')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              CTR: {metrics.avg_ctr}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Jornada do usuário nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{formatNumber(metrics.total_impressions)}</div>
              <p className="text-sm text-muted-foreground">Impressões</p>
            </div>
            <div className="text-center">
              <MousePointer className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{formatNumber(metrics.total_clicks)}</div>
              <p className="text-sm text-muted-foreground">Cliques</p>
            </div>
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{formatNumber(metrics.total_add_to_cart)}</div>
              <p className="text-sm text-muted-foreground">Add to Cart</p>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">{formatNumber(metrics.total_purchases)}</div>
              <p className="text-sm text-muted-foreground">Compras</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Diária</CardTitle>
          <CardDescription>Desempenho dos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Investimento</th>
                  <th className="text-right p-2">Impressões</th>
                  <th className="text-right p-2">Cliques</th>
                  <th className="text-right p-2">Compras</th>
                  <th className="text-right p-2">Receita</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      {new Date(day.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2 text-right">{formatCurrency(day.spend)}</td>
                    <td className="p-2 text-right">{formatNumber(day.impressions)}</td>
                    <td className="p-2 text-right">{formatNumber(day.clicks)}</td>
                    <td className="p-2 text-right">{day.purchases}</td>
                    <td className="p-2 text-right">{formatCurrency(day.revenue || '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Campanha</CardTitle>
          <CardDescription>Top campanhas por investimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignData.slice(0, 5).map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{campaign.campaign}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>CTR: {campaign.ctr}%</span>
                    <span>Conv: {campaign.conversion_rate}%</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium">{formatCurrency(campaign.spend)}</p>
                  <p className="text-xs text-muted-foreground">{campaign.purchases} compras</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}