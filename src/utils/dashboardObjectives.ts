/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mapeamento entre tipos de dashboard e objetivos Meta Ads
 * Baseado na análise da tabela j_rep_metaads_bronze
 */

export type DashboardType = 
  | 'geral' 
  | 'vendas' 
  | 'trafego' 
  | 'engajamento' 
  | 'leads' 
  | 'reconhecimento' 
  | 'alcance' 
  | 'video' 
  | 'conversoes' 
  | 'seguidores' 
  | 'conversas' 
  | 'cadastros';

export type MetaObjective = 
  | 'OUTCOME_SALES'
  | 'LINK_CLICKS' 
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_AWARENESS'
  | 'APP_INSTALLS'
  | 'MESSAGES';

/**
 * Mapeia tipo de dashboard para objetivos Meta Ads específicos
 * Se retorna null, o dashboard deve agregar todos os objetivos
 */
export const getDashboardObjectives = (dashboardType: DashboardType): MetaObjective[] | null => {
  const mapping: Record<DashboardType, MetaObjective[] | null> = {
    // ✅ Dashboards com objetivos específicos (dados verificados)
    'vendas': ['OUTCOME_SALES'],
    'trafego': ['LINK_CLICKS'],
    'engajamento': ['OUTCOME_ENGAGEMENT'], 
    'leads': ['OUTCOME_LEADS'],
    'reconhecimento': ['OUTCOME_AWARENESS'],
    'conversas': ['MESSAGES'],
    
    // ⚠️ Dashboards que agregam todos os objetivos
    'geral': null,            // Visão geral de tudo
    'alcance': null,          // Alcance de todas as campanhas
    'video': null,            // Reproduções de vídeo de todas as campanhas
    'conversoes': null,       // Conversões de todas as campanhas
    'seguidores': null,       // Page likes de campanhas de awareness + engagement
    'cadastros': null,        // Leads + complete registration de várias campanhas
  };

  return mapping[dashboardType];
};

/**
 * Gera filtro SQL para objetivos específicos
 */
export const getObjectiveFilter = (dashboardType: DashboardType): string => {
  const objectives = getDashboardObjectives(dashboardType);
  
  if (!objectives || objectives.length === 0) {
    // Sem filtro - pega todos os objetivos
    return '';
  }
  
  if (objectives.length === 1) {
    return `objective = '${objectives[0]}'`;
  }
  
  // Múltiplos objetivos
  return `objective IN (${objectives.map(obj => `'${obj}'`).join(', ')})`;
};

/**
 * Aplica filtro de objetivo na query Supabase
 */
export const applyObjectiveFilter = (query: any, dashboardType: DashboardType) => {
  const objectives = getDashboardObjectives(dashboardType);
  
  if (!objectives || objectives.length === 0) {
    // Sem filtro - retorna query original
    return query;
  }
  
  if (objectives.length === 1) {
    return query.eq('objective', objectives[0]);
  }
  
  // Múltiplos objetivos
  return query.in('objective', objectives);
};

/**
 * Informações sobre cada objetivo Meta Ads
 */
export const OBJECTIVE_INFO = {
  'OUTCOME_SALES': {
    name: 'Vendas',
    description: 'Otimizado para conversões de compra',
    primaryMetrics: ['Purchase ROAS', 'CPA', 'Revenue', 'Conversions']
  },
  'LINK_CLICKS': {
    name: 'Tráfego', 
    description: 'Otimizado para cliques no site',
    primaryMetrics: ['Link Clicks', 'CPC', 'CTR', 'Traffic Quality']
  },
  'OUTCOME_ENGAGEMENT': {
    name: 'Engajamento',
    description: 'Otimizado para interações sociais',
    primaryMetrics: ['Post Engagement', 'Comments', 'Shares', 'Reactions']
  },
  'OUTCOME_LEADS': {
    name: 'Leads',
    description: 'Otimizado para captura de leads',
    primaryMetrics: ['Leads', 'CPL', 'Lead Quality', 'Form Completion']
  },
  'OUTCOME_AWARENESS': {
    name: 'Reconhecimento de Marca',
    description: 'Otimizado para alcance e impressões',
    primaryMetrics: ['Reach', 'CPM', 'Frequency', 'Brand Recall']
  },
  'APP_INSTALLS': {
    name: 'Instalações do Aplicativo',
    description: 'Otimizado para downloads de app',
    primaryMetrics: ['App Installs', 'CPI', 'Install Rate', 'App Events']
  },
  'MESSAGES': {
    name: 'Mensagens',
    description: 'Otimizado para conversas no Messenger/WhatsApp',
    primaryMetrics: ['Messages', 'CPM', 'Message Rate', 'Response Rate']
  }
} as const;