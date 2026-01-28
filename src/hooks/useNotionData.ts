/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Client, Partner } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';
import { normalizeObjective, getDistinctObjectives } from '../utils/objectives';

interface NotionClient {
  id: string;
  properties: {
    [key: string]: any;
  };
}

interface NotionPartner {
  id: string;
  properties: {
    [key: string]: any;
  };
}

// Helper function to extract text from Notion property
const extractTextFromProperty = (property: any): string => {
  if (!property) return 'Sem nome';
  
  // Handle title property
  if (property.title && Array.isArray(property.title) && property.title.length > 0) {
    return property.title[0].plain_text || 'Sem nome';
  }
  
  // Handle rich_text property
  if (property.rich_text && Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    return property.rich_text[0].plain_text || 'Sem nome';
  }
  
  // Handle plain_text property
  if (property.plain_text) {
    return property.plain_text;
  }
  
  return 'Sem nome';
};

export const useNotionClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { accounts, accountIds, loading: accountsLoading, error: accountsError } = useMyNotionAccounts();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAccessibleAccounts, setUserAccessibleAccounts] = useState<string[]>([]);

  useEffect(() => {
    const checkRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = currentUser?.id || authData?.user?.id || null;
      if (!userId) return setIsAdmin(false);
      const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!error && !!data);
    };
    checkRole();
  }, [currentUser?.id]);

  useEffect(() => {
    if (accountsLoading) {
      setLoading(true);
      return;
    }

    try {
      console.log('🔄 Processing clients from synchronized data...');
      
      if (accountsError) {
        throw new Error(accountsError);
      }

      // Store user's specifically linked accounts
      setUserAccessibleAccounts(accountIds || []);
      
      let processedClients: Client[] = [];

      if (!isAdmin) {
        // Regular users: use their linked accounts from the complete data
        processedClients = accounts.map((account: any) => {
          // Handle both string and array formats for objectives
          let objectives = [];
          if (Array.isArray(account.objectives)) {
            objectives = account.objectives;
          } else if (typeof account.objectives === 'string') {
            objectives = account.objectives.split(', ').filter(Boolean);
          }
          
          return {
            id: account.id,
            name: account.name || 'Sem nome',
            objectives,
            metaAdsId: account.id_meta_ads || account.meta_ads_id, // Include Meta Ads ID for reports
            id_google_ads: account.id_google_ads, // Include Google Ads ID for reports
            id_google_analytics: account.id_google_analytics // Include GA4 property ID for reports
          };
        });
        
        
        if (processedClients.length === 0) {
          setError('Você não tem contas vinculadas no Notion.');
        } else {
          setError(null);
        }
      } else {
        // Admin users: fetch all accounts from the complete synchronized table
        console.log('🔍 Admin user - fetching all accounts from synchronized table...');
        
        const fetchAllAccounts = async () => {
          const { data, error } = await supabase
            .from('j_hub_notion_db_accounts')
            .select('notion_id, "Conta", "Objetivos", "ID Meta Ads", "ID Google Ads", "ID Google Analytics"');

          if (error) throw error;

          processedClients = (data || []).map((account: any) => ({
            id: account.notion_id,
            name: account.Conta || 'Sem nome',
            objectives: account.Objetivos ? account.Objetivos.split(', ').filter(Boolean) : [],
            metaAdsId: account["ID Meta Ads"], // Include Meta Ads ID for reports
            id_google_ads: account["ID Google Ads"], // Include Google Ads ID for reports
            id_google_analytics: account["ID Google Analytics"] // Include GA4 property ID for reports
          }));
          
          setClients(processedClients);
          setError(null);
        };
        
        fetchAllAccounts().catch((err) => {
          console.error('Error fetching admin accounts:', err);
          throw err;
        });
        
        setLoading(false);
        return;
      }
      
      setClients(processedClients);
      
    } catch (err) {
      console.error('Error processing clients:', err);
      setError('Erro ao carregar clientes do Supabase');
      
      // Fallback para dados hardcoded se tudo falhar
      setClients([
        { id: "fallback-1", name: "Almeida Prado B2B", objectives: ["Vendas", "Tráfego"] },
        { id: "fallback-2", name: "Almeida Prado Ecommerce", objectives: ["Conversões", "Leads"] },
        { id: "fallback-3", name: "LEAP Lab", objectives: ["Reconhecimento", "Engajamento"] },
        { id: "fallback-4", name: "Koko Educação", objectives: ["Leads", "Tráfego"] },
        { id: "fallback-5", name: "Supermercadistas", objectives: ["Vendas", "Tráfego"] }
      ]);
    } finally {
      setLoading(false);
    }
  }, [accounts, accountIds, accountsLoading, accountsError, isAdmin]);

  return { clients, loading, error, isAdmin, userAccessibleAccounts };
};

export const useNotionPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        console.log('Partners functionality disabled - using fallback data');
        
        // Fallback para dados hardcoded
        setPartners([
          { id: "fallback-1", name: "Roberta - LEAP Lab" },
          { id: "fallback-2", name: "Murilo - Agência Koko" },
          { id: "fallback-3", name: "Carlos - Almeida Prado" },
          { id: "fallback-4", name: "Ana - Supermercadistas" }
        ]);
        setError(null);
      } catch (err) {
        console.error('Error setting up partners:', err);
        setError('Erro ao carregar parceiros');
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading, error };
};
