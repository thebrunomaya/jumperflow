/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Optimization Types - Shared Interface Between OPTIMIZER and REPORTS Branches
 *
 * This file defines the contract between:
 * - OPTIMIZER branch (Lovable): Records and transcribes optimization audio
 * - REPORTS branch (Claude Code): Consumes optimization context for insights
 *
 * DO NOT modify these interfaces without updating both branches!
 *
 * Created: 2025-10-07
 * Last Updated: 2025-10-07
 */

// ============================================================================
// OPTIMIZATION ACTIONS
// ============================================================================

/**
 * Types of actions a manager can take during optimization
 */
export type OptimizationActionType =
  | 'pause_campaign'      // Pausou campanha/ad
  | 'activate_campaign'   // Ativou campanha/ad
  | 'increase_budget'     // Aumentou investimento
  | 'decrease_budget'     // Reduziu investimento
  | 'new_creative'        // Publicou novo criativo
  | 'pause_creative'      // Pausou criativo existente
  | 'audience_change'     // Mudou público-alvo
  | 'bidding_change'      // Mudou estratégia de lance
  | 'other';              // Outra ação

/**
 * Single action taken during optimization
 */
export interface OptimizationAction {
  type: OptimizationActionType;
  target: string;                  // Nome da campanha/ad/criativo afetado
  reason: string;                  // Por que tomou essa ação
  expected_impact?: string;        // Impacto esperado (opcional)
  metrics_before?: Record<string, number>; // Métricas antes da ação
}

// ============================================================================
// OPTIMIZATION STRATEGY
// ============================================================================

/**
 * Types of strategic objectives for optimizations
 */
export type StrategyType =
  | 'test'       // Testar nova abordagem
  | 'scale'      // Escalar o que está funcionando
  | 'optimize'   // Otimizar performance atual
  | 'maintain'   // Manter status quo
  | 'pivot';     // Mudar completamente de direção

/**
 * Strategy context for the optimization
 */
export interface OptimizationStrategy {
  type: StrategyType;
  duration_days: number;           // Quanto tempo esperar antes de reavaliar
  success_criteria: string;        // Como definir se foi bem-sucedido
  hypothesis?: string;             // Hipótese sendo testada (para 'test')
  target_metric?: string;          // Métrica principal de sucesso
  target_value?: number;           // Valor alvo para métrica
}

// ============================================================================
// OPTIMIZATION TIMELINE
// ============================================================================

/**
 * Timeline and next steps for optimization
 */
export interface OptimizationTimeline {
  reevaluate_date: Date;           // Quando reavaliar os resultados
  milestones?: Array<{             // Marcos intermediários (opcional)
    date: Date;
    description: string;
    expected_metrics?: Record<string, number>;
  }>;
}

// ============================================================================
// COMPLETE OPTIMIZATION CONTEXT
// ============================================================================

/**
 * Complete context for an optimization session
 * This is what REPORTS branch will consume
 */
export interface OptimizationContext {
  // Identification
  id: string;
  account_id: string;
  account_name?: string;
  recorded_by: string;             // Email do gestor
  recorded_at: Date;

  // Summary
  summary: string;                 // Resumo executivo em português (200 palavras)

  // Detailed context
  actions_taken: OptimizationAction[];
  metrics_mentioned: Record<string, number>; // {cpa: 200, roas: 2.5, ctr: 1.8}
  strategy: OptimizationStrategy;
  timeline: OptimizationTimeline;

  // Metadata
  confidence_level?: 'high' | 'medium' | 'low' | 'revised'; // Confiança na extração pela IA ou revisado manualmente
  client_report_generated?: boolean;            // Relatório para cliente foi gerado?
  client_report_sent_at?: Date;
}

// ============================================================================
// QUICK NOTES (Used by REPORTS before OPTIMIZER is ready)
// ============================================================================

/**
 * Quick note captured by REPORTS branch when detecting changes
 * This is a simpler, interim solution before OPTIMIZER audio is available
 */
export interface QuickNote {
  id: string;
  account_id: string;
  change_detected: string;         // 'budget_increase_150%' | 'new_creative_published'
  note: string;                    // Campo livre do gestor
  tags: string[];                  // ['teste', 'escala', 'otimização']
  created_by: string;              // Email do gestor
  created_at: Date;
}

// ============================================================================
// DATABASE TYPES (For Supabase queries)
// ============================================================================

/**
 * Row from j_hub_optimization_recordings table
 */
export interface OptimizationRecordingRow {
  id: string;
  account_id: string;  // UUID reference to j_hub_notion_db_accounts(id)
  recorded_by: string;
  recorded_at: string;             // ISO timestamp
  audio_file_path: string | null;
  duration_seconds: number | null;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Row from j_hub_optimization_transcripts table
 */
export interface OptimizationTranscriptRow {
  id: string;
  recording_id: string;
  full_text: string;
  processed_text: string | null;   // AI-organized transcript with topics
  original_text: string | null;    // Original Whisper output
  language: string;
  confidence_score: number | null;
  segments: any | null;            // JSONB - array of {start, end, text}
  revised_at: string | null;       // When was it last revised
  revised_by: string | null;       // Who revised it
  created_at: string;
}

/**
 * Row from j_hub_optimization_context table
 * This is the main table REPORTS will query
 */
export interface OptimizationContextRow {
  id: string;
  recording_id: string;
  account_id: string;  // UUID reference to j_hub_notion_db_accounts(id)
  summary: string;

  // JSONB fields
  actions_taken: any;              // OptimizationAction[]
  metrics_mentioned: any;          // Record<string, number>
  strategy: any;                   // OptimizationStrategy
  timeline: any;                   // OptimizationTimeline

  confidence_level: string | null;
  client_report_generated: boolean;
  client_report_sent_at: string | null;
  created_at: string;
}

/**
 * Row from j_ads_quick_notes table
 */
export interface QuickNoteRow {
  id: string;
  account_id: string;
  change_detected: string;
  note: string;
  tags: string[];
  created_by: string;
  created_at: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert database row to OptimizationContext object
 */
export function rowToOptimizationContext(row: OptimizationContextRow): OptimizationContext {
  return {
    id: row.id,
    account_id: row.account_id,
    recorded_by: '', // Will be joined from recordings table
    recorded_at: new Date(row.created_at),
    summary: row.summary,
    actions_taken: row.actions_taken as OptimizationAction[],
    metrics_mentioned: row.metrics_mentioned as Record<string, number>,
    strategy: row.strategy as OptimizationStrategy,
    timeline: {
      reevaluate_date: new Date(row.timeline.reevaluate_date),
      milestones: row.timeline.milestones?.map((m: any) => ({
        ...m,
        date: new Date(m.date)
      }))
    },
    confidence_level: row.confidence_level as 'high' | 'medium' | 'low' | 'revised' | undefined,
    client_report_generated: row.client_report_generated,
    client_report_sent_at: row.client_report_sent_at ? new Date(row.client_report_sent_at) : undefined
  };
}

/**
 * Convert database row to QuickNote object
 */
export function rowToQuickNote(row: QuickNoteRow): QuickNote {
  return {
    id: row.id,
    account_id: row.account_id,
    change_detected: row.change_detected,
    note: row.note,
    tags: row.tags,
    created_by: row.created_by,
    created_at: new Date(row.created_at)
  };
}

/**
 * Get human-readable action type label
 */
export function getActionTypeLabel(type: OptimizationActionType): string {
  const labels: Record<OptimizationActionType, string> = {
    'pause_campaign': 'Pausou campanha',
    'activate_campaign': 'Ativou campanha',
    'increase_budget': 'Aumentou budget',
    'decrease_budget': 'Reduziu budget',
    'new_creative': 'Novo criativo',
    'pause_creative': 'Pausou criativo',
    'audience_change': 'Mudou audiência',
    'bidding_change': 'Mudou lance',
    'other': 'Outra ação'
  };
  return labels[type];
}

/**
 * Get human-readable strategy type label
 */
export function getStrategyTypeLabel(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    'test': 'Teste',
    'scale': 'Escala',
    'optimize': 'Otimização',
    'maintain': 'Manutenção',
    'pivot': 'Pivot'
  };
  return labels[type];
}
