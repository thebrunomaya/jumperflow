/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OptimizationPrompt {
  id: string;
  platform: 'meta' | 'google';
  objective: string;
  prompt_type: 'transcribe' | 'process' | 'analyze';
  prompt_text: string;
  variables: string[];
  is_default: boolean;
  edited_by?: string;
  previous_version?: string;
  created_at: string;
  updated_at: string;
}

export const useOptimizationPrompts = () => {
  const [prompts, setPrompts] = useState<OptimizationPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('j_hub_optimization_prompts')
        .select('*')
        .order('platform', { ascending: true })
        .order('objective', { ascending: true });

      if (error) throw error;
      setPrompts((data || []) as OptimizationPrompt[]);
    } catch (error: any) {
      console.error('Error fetching prompts:', error);
      toast.error('Erro ao carregar prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const getPrompt = (
    platform: 'meta' | 'google',
    objective: string,
    type: 'transcribe' | 'process' | 'analyze'
  ): OptimizationPrompt | undefined => {
    return prompts.find(
      (p) => p.platform === platform && p.objective === objective && p.prompt_type === type
    );
  };

  const getAllPromptsForObjective = (
    platform: 'meta' | 'google',
    objective: string
  ): {
    transcribe?: OptimizationPrompt;
    process?: OptimizationPrompt;
    analyze?: OptimizationPrompt;
  } => {
    return {
      transcribe: getPrompt(platform, objective, 'transcribe'),
      process: getPrompt(platform, objective, 'process'),
      analyze: getPrompt(platform, objective, 'analyze'),
    };
  };

  const updatePrompt = async (
    id: string,
    newText: string,
    userEmail: string
  ): Promise<boolean> => {
    try {
      const currentPrompt = prompts.find(p => p.id === id);
      
      const { error } = await supabase
        .from('j_hub_optimization_prompts')
        .update({
          prompt_text: newText,
          edited_by: userEmail,
          previous_version: currentPrompt?.prompt_text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Prompt atualizado com sucesso');
      await fetchPrompts();
      return true;
    } catch (error: any) {
      console.error('Error updating prompt:', error);
      toast.error('Erro ao atualizar prompt');
      return false;
    }
  };

  const renderPromptVariables = (
    promptText: string,
    variables: {
      account_name?: string;
      objectives?: string[];
      platform?: string;
      context?: string;
    }
  ): string => {
    let rendered = promptText;
    
    if (variables.account_name) {
      rendered = rendered.replace(/{account_name}/g, variables.account_name);
    }
    if (variables.objectives && variables.objectives.length > 0) {
      rendered = rendered.replace(/{objectives}/g, variables.objectives.join(', '));
    }
    if (variables.platform) {
      rendered = rendered.replace(/{platform}/g, variables.platform);
    }
    if (variables.context) {
      rendered = rendered.replace(/{context}/g, variables.context);
    }
    
    return rendered;
  };

  return {
    prompts,
    loading,
    getPrompt,
    getAllPromptsForObjective,
    updatePrompt,
    renderPromptVariables,
    refetch: fetchPrompts,
  };
};
