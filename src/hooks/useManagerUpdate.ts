/**
 * useManagerUpdate - Hook for updating manager data via Edge Function
 * Updates both Notion and Supabase in a single call
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ManagerUpdates {
  Nome?: string;
  "E-Mail"?: string;
  Telefone?: string;
  Funcao?: string[];
}

interface UpdateResult {
  success: boolean;
  updated_fields?: string[];
  manager_name?: string;
  error?: string;
}

export function useManagerUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateManager = async (managerId: string, updates: ManagerUpdates): Promise<UpdateResult> => {
    setIsUpdating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<UpdateResult>(
        'j_hub_manager_update',
        { body: { manager_id: managerId, updates } }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to call update function');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Update failed');
      }

      toast({
        title: "Gerente atualizado",
        description: `${data.manager_name || 'Gerente'} foi atualizado com sucesso.`,
      });

      return data;
    } catch (err) {
      const message = err.message || 'Erro ao atualizar gerente';
      setError(message);
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateManager, isUpdating, error };
}
