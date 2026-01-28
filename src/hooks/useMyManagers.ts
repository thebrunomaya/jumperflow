/**
 * useMyManagers - Hook for fetching managers from j_hub_notion_db_managers
 * Only admin users can access this data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotionManager {
  id: string;
  notion_id: string;
  nome: string;
  email: string;
  telefone: string;
  funcao: string[];
  organizacao: string;
  contas: string;
}

interface UseMyManagersReturn {
  managers: NotionManager[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMyManagers(): UseMyManagersReturn {
  const [managers, setManagers] = useState<NotionManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('j_hub_notion_db_managers')
        .select('*')
        .order('"Nome"', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedManagers: NotionManager[] = (data || []).map(m => ({
        id: m.id,
        notion_id: m.notion_id,
        nome: m["Nome"] || '',
        email: m["E-Mail"] || '',
        telefone: m["Telefone"] || '',
        funcao: m["Função"] ? m["Função"].split(', ').filter(Boolean) : [],
        organizacao: m["Organização"] || '',
        contas: m["Contas"] || '',
      }));

      setManagers(mappedManagers);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError(err.message || 'Failed to fetch managers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  return { managers, loading, error, refetch: fetchManagers };
}
