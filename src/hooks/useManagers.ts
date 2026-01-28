/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Manager {
  id: string;
  name: string;
  email?: string;
  username?: string;
  password?: string; // Add password field
  accounts?: string[]; // IDs das contas que o gerente tem acesso
}

// Helper function to extract text from Notion property
const extractTextFromProperty = (property: any): string => {
  if (!property) return '';
  
  // Handle title property
  if (property.title && Array.isArray(property.title) && property.title.length > 0) {
    return property.title[0].plain_text || '';
  }
  
  // Handle rich_text property
  if (property.rich_text && Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    return property.rich_text[0].plain_text || '';
  }
  
  // Handle email property
  if (property.email) {
    return property.email;
  }
  
  // Handle plain_text property
  if (property.plain_text) {
    return property.plain_text;
  }
  
  return '';
};

// Helper function to extract account IDs from relation property
const extractAccountIds = (property: any): string[] => {
  if (!property || !property.relation || !Array.isArray(property.relation)) {
    return [];
  }
  
  return property.relation.map((item: any) => item.id).filter(Boolean);
};

export const useManagers = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    try {
      console.log('Fetching managers from synchronized table j_hub_notion_db_managers...');
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('j_hub_notion_db_managers')
        .select('*');
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Raw synchronized managers data:', data);
      
      if (!data || !Array.isArray(data)) {
        console.warn('No results found in synchronized table');
        setManagers([]);
        setError(null);
        return;
      }
      
      const formattedManagers: Manager[] = data.map((item: any) => {
        return {
          id: item.notion_id || item.id,
          name: item.name || 'Sem nome',
          email: item.email || '',
          username: item.email || '', // Use email as username for login validation
          password: item.password || '', // Senha from synchronized table
          accounts: item.accounts ? (typeof item.accounts === 'string' ? item.accounts.split(',').map(s => s.trim()) : item.accounts) : []
        };
      });
      
      console.log('Formatted managers:', formattedManagers);
      setManagers(formattedManagers);
      setError(null);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Erro ao carregar gerentes do Notion');
      setManagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const validateLogin = (email: string, password: string): Manager | null => {
    // Validação usando e-mail e senha específica do gerente
    const manager = managers.find(m => 
      m.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (manager && manager.password && manager.password === password) {
      return manager;
    }
    
    return null;
  };

  return { managers, loading, error, validateLogin, refetch: fetchManagers };
};
