/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Receipt, CreditCard, FileText, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountMetrics, DashboardObjective } from '@/hooks/useMultiAccountMetrics';
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';

export interface AccountsMetricsTableProps {
  accounts: AccountMetrics[];
  objective: DashboardObjective;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface ColumnDef {
  key: string;
  label: string;
  format: 'currency' | 'number' | 'percentage' | 'decimal';
  accessor: (metrics: any) => number;
}

// Column definitions per objective
const COLUMN_DEFINITIONS: Record<DashboardObjective, ColumnDef[]> = {
  geral: [
    { key: 'spend', label: 'Gasto Total', format: 'currency', accessor: (m) => m.spend },
    { key: 'impressions', label: 'Impressões', format: 'number', accessor: (m) => m.impressions },
    { key: 'link_clicks', label: 'Cliques Link', format: 'number', accessor: (m) => m.link_clicks },
    { key: 'ctr_link', label: 'CTR Link (%)', format: 'percentage', accessor: (m) => m.ctr_link },
  ],
  vendas: [
    { key: 'spend', label: 'Gasto Compras', format: 'currency', accessor: (m) => m.spend },
    { key: 'cpa', label: 'Custo por Compra', format: 'currency', accessor: (m) => m.cpa },
    { key: 'purchases', label: 'Compras', format: 'number', accessor: (m) => m.purchases },
    { key: 'roas', label: 'ROAS', format: 'decimal', accessor: (m) => m.roas },
  ],
  trafego: [
    { key: 'spend', label: 'Gasto Tráfego', format: 'currency', accessor: (m) => m.spend },
    { key: 'link_clicks', label: 'Cliques Link', format: 'number', accessor: (m) => m.link_clicks },
    { key: 'cpc', label: 'CPC', format: 'currency', accessor: (m) => m.cpc },
    { key: 'ctr_link', label: 'CTR Link (%)', format: 'percentage', accessor: (m) => m.ctr_link },
  ],
  leads: [
    { key: 'spend', label: 'Gasto Leads', format: 'currency', accessor: (m) => m.spend },
    { key: 'leads', label: 'Leads', format: 'number', accessor: (m) => m.leads },
    { key: 'cpl', label: 'CPL', format: 'currency', accessor: (m) => m.cpl },
    { key: 'conversion_rate', label: 'Taxa Conv. (%)', format: 'percentage', accessor: (m) => m.conversion_rate },
  ],
  engajamento: [
    { key: 'spend', label: 'Gasto Eng.', format: 'currency', accessor: (m) => m.spend },
    { key: 'engagements', label: 'Interações', format: 'number', accessor: (m) => m.engagements },
    { key: 'cpe', label: 'CPE', format: 'currency', accessor: (m) => m.cpe },
    { key: 'engagement_rate', label: 'Taxa Eng. (%)', format: 'percentage', accessor: (m) => m.engagement_rate },
  ],
  reconhecimento: [
    { key: 'spend', label: 'Gasto Marca', format: 'currency', accessor: (m) => m.spend },
    { key: 'reach', label: 'Alcance', format: 'number', accessor: (m) => m.reach },
    { key: 'cpm', label: 'CPM', format: 'currency', accessor: (m) => m.cpm },
    { key: 'frequency', label: 'Frequência', format: 'decimal', accessor: (m) => m.frequency },
  ],
  video: [
    { key: 'spend', label: 'Gasto Vídeo', format: 'currency', accessor: (m) => m.spend },
    { key: 'video_views_100', label: 'Views 100%', format: 'number', accessor: (m) => m.video_views_100 },
    { key: 'cpv', label: 'CPV', format: 'currency', accessor: (m) => m.cpv },
    { key: 'completion_rate', label: 'Taxa Conclusão (%)', format: 'percentage', accessor: (m) => m.completion_rate },
  ],
  conversoes: [
    { key: 'spend', label: 'Gasto Conv.', format: 'currency', accessor: (m) => m.spend },
    { key: 'conversions', label: 'Conversões', format: 'number', accessor: (m) => m.conversions },
    { key: 'cpa', label: 'CPA', format: 'currency', accessor: (m) => m.cpa },
    { key: 'roas', label: 'ROAS', format: 'decimal', accessor: (m) => m.roas },
  ],
  alcance: [
    { key: 'spend', label: 'Gasto Alcance', format: 'currency', accessor: (m) => m.spend },
    { key: 'reach', label: 'Alcance', format: 'number', accessor: (m) => m.reach },
    { key: 'cpm', label: 'CPM', format: 'currency', accessor: (m) => m.cpm },
    { key: 'impressions', label: 'Impressões', format: 'number', accessor: (m) => m.impressions },
  ],
  conversas: [
    { key: 'spend', label: 'Gasto Msgs', format: 'currency', accessor: (m) => m.spend },
    { key: 'messages', label: 'Mensagens', format: 'number', accessor: (m) => m.messages },
    { key: 'cpm', label: 'CPM', format: 'currency', accessor: (m) => m.cpm },
    { key: 'response_rate', label: 'Taxa Resposta (%)', format: 'percentage', accessor: (m) => m.response_rate },
  ],
  cadastros: [
    { key: 'spend', label: 'Gasto Cadastro', format: 'currency', accessor: (m) => m.spend },
    { key: 'registrations', label: 'Cadastros', format: 'number', accessor: (m) => m.registrations },
    { key: 'cpc', label: 'CPC', format: 'currency', accessor: (m) => m.cpc },
    { key: 'registration_rate', label: 'Taxa Cadastro (%)', format: 'percentage', accessor: (m) => m.registration_rate },
  ],
  seguidores: [
    { key: 'spend', label: 'Gasto Seg.', format: 'currency', accessor: (m) => m.spend },
    { key: 'followers', label: 'Seguidores', format: 'number', accessor: (m) => m.followers },
    { key: 'cps', label: 'CPS', format: 'currency', accessor: (m) => m.cps },
    { key: 'reach', label: 'Alcance', format: 'number', accessor: (m) => m.reach },
  ],
};

// Payment method icons and styles
const paymentMethodConfig: Record<string, { icon: typeof CreditCard; label: string; color: string }> = {
  'Boleto': { icon: Receipt, label: 'Boleto', color: 'text-orange-500' },
  'Cartão': { icon: CreditCard, label: 'Cartão', color: 'text-blue-500' },
  'Faturamento': { icon: FileText, label: 'Faturamento', color: 'text-purple-500' },
  'Misto': { icon: Shuffle, label: 'Misto', color: 'text-gray-500' },
};

// Days remaining color thresholds (ONLY for Boleto accounts)
// Boleto with days < 999: show "X dias" with color
// Boleto with days >= 999: show "∞" (has spend_cap but no recent spend)
// Non-Boleto: show "-" (balance indicator not applicable)
const getDaysRemainingStyle = (days: number | null | undefined): { text: string; bg: string } => {
  if (days === null || days === undefined) return { text: 'text-muted-foreground', bg: 'bg-muted/30' };
  if (days >= 999) return { text: 'text-muted-foreground', bg: 'bg-muted/30' }; // Infinite - no recent spend
  if (days > 20) return { text: 'text-[hsl(var(--metric-excellent))]', bg: 'bg-[hsl(var(--metric-excellent))]/10' }; // Green
  if (days >= 11) return { text: 'text-[hsl(var(--metric-warning))]', bg: 'bg-[hsl(var(--metric-warning))]/10' }; // Yellow
  return { text: 'text-[hsl(var(--metric-critical))]', bg: 'bg-[hsl(var(--metric-critical))]/10' }; // Red
};

function formatValue(value: number | undefined, format: ColumnDef['format']): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);

    case 'number':
      return new Intl.NumberFormat('pt-BR').format(Math.round(value));

    case 'percentage':
      return `${value.toFixed(2)}%`;

    case 'decimal':
      return value.toFixed(2);

    default:
      return String(value);
  }
}

export function AccountsMetricsTable({ accounts, objective, loading }: AccountsMetricsTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch account balance data from Notion accounts
  const { accounts: notionAccounts } = useMyNotionAccounts();

  // Create a map of meta_ads_id -> balance info for quick lookup
  const balanceMap = useMemo(() => {
    const map = new Map<string, { payment_method?: string | null; days_remaining?: number | null }>();
    notionAccounts.forEach((account) => {
      if (account.meta_ads_id) {
        map.set(account.meta_ads_id, {
          payment_method: account.payment_method,
          days_remaining: account.days_remaining,
        });
      }
    });
    return map;
  }, [notionAccounts]);

  const columns = COLUMN_DEFINITIONS[objective];

  // Filter accounts by search term
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) =>
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  // Sort accounts
  const sortedAccounts = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredAccounts;
    }

    const column = columns.find((c) => c.key === sortColumn);
    if (!column) return filteredAccounts;

    return [...filteredAccounts].sort((a, b) => {
      const valueA = column.accessor(a.metrics);
      const valueB = column.accessor(b.metrics);

      if (sortDirection === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }, [filteredAccounts, sortColumn, sortDirection, columns]);

  // Calculate totals
  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    columns.forEach((column) => {
      result[column.key] = accounts.reduce((sum, account) => {
        const value = column.accessor(account.metrics);
        return sum + (value || 0);
      }, 0);
    });

    return result;
  }, [accounts, columns]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (accountName: string) => {
    navigate(`/dashboards/${encodeURIComponent(accountName)}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
          <CardDescription>Buscando métricas das contas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Métricas por Conta</CardTitle>
            <CardDescription>
              {filteredAccounts.length} conta{filteredAccounts.length !== 1 ? 's' : ''} encontrada
              {filteredAccounts.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar conta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium sticky left-0 bg-background z-10">
                  Conta
                </th>
                <th className="text-center p-3 font-medium">
                  Pagamento
                </th>
                <th className="text-center p-3 font-medium">
                  Saldo
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-right p-3 font-medium cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{column.label}</span>
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 3} className="text-center p-8 text-muted-foreground">
                    {searchTerm
                      ? 'Nenhuma conta encontrada com esse termo'
                      : 'Nenhuma conta com dados para este objetivo'}
                  </td>
                </tr>
              ) : (
                sortedAccounts.map((account) => {
                  const balanceInfo = balanceMap.get(account.meta_ads_id);
                  const paymentMethod = balanceInfo?.payment_method;
                  const daysRemaining = balanceInfo?.days_remaining;
                  const isBoleto = paymentMethod === 'Boleto';
                  // Only show balance indicator for Boleto accounts
                  // isDepleted: Boleto with balance = 0 (show ❌)
                  const isDepleted = isBoleto && daysRemaining === 0;
                  // hasDaysData: Boleto with actual days (1-998)
                  const hasDaysData = isBoleto && daysRemaining !== null && daysRemaining !== undefined && daysRemaining > 0 && daysRemaining < 999;
                  // isInfinite: Boleto with spend_cap but no recent spend data (show ∞)
                  const isInfinite = isBoleto && daysRemaining !== null && daysRemaining !== undefined && daysRemaining >= 999;
                  const daysStyle = getDaysRemainingStyle(daysRemaining);
                  const paymentConfig = paymentMethod ? paymentMethodConfig[paymentMethod] : null;

                  return (
                    <tr
                      key={account.account_id}
                      onClick={() => handleRowClick(account.account_name)}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-medium sticky left-0 bg-background z-10">
                        {account.account_name}
                      </td>
                      {/* Coluna Pagamento */}
                      <td className="p-3 text-center">
                        {paymentConfig ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium inline-flex items-center gap-1',
                              paymentConfig.color,
                              'border-current/20 bg-current/5'
                            )}
                          >
                            <paymentConfig.icon className="h-3 w-3" />
                            {paymentConfig.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      {/* Coluna Saldo (dias restantes) */}
                      <td className="p-3 text-center">
                        {isDepleted ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-bold text-[hsl(var(--metric-critical))] bg-[hsl(var(--metric-critical))]/10 border-current/20"
                          >
                            ❌
                          </Badge>
                        ) : hasDaysData ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-bold',
                              daysStyle.text,
                              daysStyle.bg,
                              'border-current/20'
                            )}
                          >
                            {Math.round(daysRemaining!)} dias
                          </Badge>
                        ) : isInfinite ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium',
                              daysStyle.text,
                              daysStyle.bg,
                              'border-current/20'
                            )}
                          >
                            ∞
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="p-3 text-right">
                          {formatValue(column.accessor(account.metrics), column.format)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedAccounts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 font-bold bg-muted/30">
                  <td className="p-3 sticky left-0 bg-muted/30 z-10">TOTAIS</td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  {columns.map((column) => (
                    <td key={column.key} className="p-3 text-right">
                      {formatValue(totals[column.key], column.format)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
