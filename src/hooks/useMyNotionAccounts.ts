import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Account data returned by the hook
 */
export interface NotionAccount {
  /** Notion page ID (unique identifier) */
  id: string;
  /** Account name (from "Conta" field) */
  name: string;
  /** List of objectives (e.g., ["Vendas", "Tráfego"]) */
  objectives?: string[];
  /** List of niches (e.g., ["E-commerce", "Saúde"]) */
  nicho?: string[];
  /** Account status */
  status?: string;
  /** Account tier */
  tier?: string;
  /** Gestor names (resolved from emails) */
  gestor?: string;
  /** Atendimento names (resolved from emails) */
  atendimento?: string;
  /** Gerente names (resolved from notion_ids) */
  gerente?: string;
  /** Meta Ads account ID */
  meta_ads_id?: string;
  /** Google Ads account ID */
  id_google_ads?: string;
  /** TikTok Ads account ID */
  id_tiktok_ads?: string | null;
  /** Google Analytics property ID */
  id_google_analytics?: string | null;
  /** Gestor emails (for matching/filtering) */
  gestor_email?: string;
  /** Atendimento emails (for matching/filtering) - renamed from supervisor_email */
  atendimento_email?: string;
  /** Full context for optimization recordings */
  contexto_otimizacao?: string;
  /** Summarized context for transcription (Whisper API) */
  contexto_transcricao?: string;
  /** Payment method (Boleto, Cartão, Faturamento, Misto) */
  payment_method?: string | null;
  /** META monthly budget */
  meta_verba_mensal?: string | null;
  /** G-ADS monthly budget */
  gads_verba_mensal?: string | null;
  /** Days remaining until balance runs out (from Meta Ads spend data) */
  days_remaining?: number | null;
  /** Current balance in BRL (from Meta Ads spend data) */
  current_balance?: number | null;
  /** WooCommerce site URL */
  woo_site_url?: string | null;
  /** WooCommerce consumer key (API credential) */
  woo_consumer_key?: string | null;
  /** WooCommerce consumer secret (API credential) */
  woo_consumer_secret?: string | null;
  /** Daily report enabled */
  report_enabled?: boolean;
  /** Target ROAS for alerts */
  report_roas_target?: number | null;
  /** Maximum acceptable CPA */
  report_cpa_max?: number | null;
  /** Minimum acceptable conversion rate */
  report_conv_min?: number | null;
  /** Daily sales target */
  report_daily_target?: number | null;
  /** WhatsApp numbers for daily reports */
  report_whatsapp_numbers?: string[];
}

/**
 * Standard hook for fetching user's accessible Notion accounts with permission-based filtering.
 *
 * **Architecture Pattern:**
 * - **Backend Centralized:** Calls Edge Function `j_hub_user_accounts` for all permission logic
 * - **Alphabetical Sorting:** Accounts returned pre-sorted by name from database
 * - **Permission-Based:** Automatically filters accounts based on user role:
 *   - Admin: ALL accounts
 *   - Staff: Accounts where user is Gestor or Atendimento
 *   - Client: Accounts linked via email matching in managers database (Gerente field)
 *
 * **Usage:**
 * Use this hook on ANY page that needs to display/filter user accounts.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { accounts, loading, error, isAdmin } = useMyNotionAccounts();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <Select>
 *       {accounts.map(account => (
 *         <SelectItem key={account.id} value={account.id}>
 *           {account.name}
 *         </SelectItem>
 *       ))}
 *     </Select>
 *   );
 * }
 * ```
 *
 * **Custom Frontend Sorting:**
 * If you need custom sorting (like MyAccounts page with priority tiers),
 * apply frontend sorting on top of alphabetical base:
 *
 * @example
 * ```tsx
 * const sortedAccounts = useMemo(() => {
 *   return [...accounts].sort((a, b) => {
 *     // Custom logic here (priority, tier, etc.)
 *     return a.name.localeCompare(b.name);
 *   });
 * }, [accounts]);
 * ```
 *
 * @returns Hook state with account data, loading status, and error handling
 */
export const useMyNotionAccounts = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<NotionAccount[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use new complete function that works with synchronized tables
      const { data, error } = await supabase.functions.invoke('j_hub_user_accounts');

      if (error) throw error;
      if (!data || data.success !== true) {
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }

      // Extract account IDs for backward compatibility
      const ids = Array.isArray(data.account_ids) ? data.account_ids : [];
      setAccountIds(ids);

      // Store complete account data (includes name, objectives, etc.)
      const completeAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      setAccounts(completeAccounts);

      // Store admin flag from edge function
      setIsAdmin(data.is_admin || false);

      console.log('✅ useMyNotionAccounts - Complete data loaded:', {
        accountIds: ids.length,
        accounts: completeAccounts.length,
        isAdmin: data.is_admin,
        source: data.source
      });

    } catch (err) {
      console.error('useMyNotionAccounts error:', err);
      setError(err?.message || 'Falha ao carregar contas do Notion');
      setAccountIds([]);
      setAccounts([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Refetch function to reload data after updates
  const refetch = () => {
    fetchAccounts();
  };

  return {
    accountIds,
    accounts,
    isAdmin,
    loading,
    error,
    refetch, // NEW: allow manual refetch after updates
  };
};
