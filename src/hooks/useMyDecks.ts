/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Complete deck data with account info
 */
export interface DeckWithDetails {
  id: string;
  user_id: string;
  account_id: string | null;
  account_name: string | null;
  title: string;
  type: 'report' | 'plan' | 'pitch';
  brand_identity: 'jumper' | 'koko';
  template_id: string;
  file_url: string | null;
  slug: string | null;
  is_public: boolean;
  current_version: number; // Version currently displayed (v1, v2, v3, ...)
  is_refined: boolean; // TRUE if deck has been refined (has versions > 1)
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all decks from accounts the user has access to
 * Uses same permission logic as /my-accounts (via j_hub_user_accounts edge function)
 */
export const useMyDecks = () => {
  const [decks, setDecks] = useState<DeckWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get user's accessible account IDs
        const { data: accountsData, error: accountsError } = await supabase.functions.invoke('j_hub_user_accounts');

        if (accountsError) throw accountsError;
        if (!accountsData || accountsData.success !== true) {
          throw new Error(accountsData?.error || 'Resposta inválida ao buscar contas');
        }

        const accountIds = Array.isArray(accountsData.account_ids) ? accountsData.account_ids : [];
        const accountsMap = new Map(
          (accountsData.accounts || []).map((acc: any) => [acc.id, acc.name])
        );

        // 2. Get current user ID for personal decks
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // 3. Fetch decks (user's own decks + decks from accessible accounts)
        // Note: RLS policies will automatically filter based on user permissions
        const { data: decksData, error: decksError } = await supabase
          .from('j_hub_decks')
          .select('*')
          .or(`user_id.eq.${user.id},account_id.in.(${accountIds.join(',')})`)
          .order('created_at', { ascending: false });

        if (decksError) throw decksError;

        // 4. Transform data
        const transformed: DeckWithDetails[] = (decksData || []).map((deck: any) => ({
          id: deck.id,
          user_id: deck.user_id,
          account_id: deck.account_id,
          account_name: deck.account_id ? (accountsMap.get(deck.account_id) || 'Conta desconhecida') : null,
          title: deck.title,
          type: deck.type,
          brand_identity: deck.brand_identity,
          template_id: deck.template_id,
          file_url: deck.file_url,
          slug: deck.slug,
          is_public: deck.is_public,
          current_version: deck.current_version || 1, // Default to v1 for legacy decks
          is_refined: deck.is_refined || false, // Default to false for legacy decks
          created_at: deck.created_at,
          updated_at: deck.updated_at,
        }));

        setDecks(transformed);

      } catch (err) {
        console.error('useMyDecks error:', err);
        setError(err?.message || 'Falha ao carregar decks');
        setDecks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  return {
    decks,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-run effect by updating a dependency (could use a counter here)
    },
  };
};
