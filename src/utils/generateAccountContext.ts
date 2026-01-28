/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generates a concise account context string for Whisper API prompts
 * Uses existing Notion account data to improve transcription accuracy
 * 
 * Max length: ~480 chars (~120 tokens) to leave room for base prompt
 */

export function generateAccountContext(accountData: any): string {
  const parts: string[] = [];
  
  // Account name
  if (accountData.Conta) {
    parts.push(`Conta: ${accountData.Conta}`);
  }
  
  // Products/Services - truncate to 100 chars
  if (accountData['Quais são os produtos/serviços que deseja divulgar?']) {
    const produtos = accountData['Quais são os produtos/serviços que deseja divulgar?'];
    parts.push(`Produtos: ${produtos.substring(0, 100)}`);
  }
  
  // Persona/Target audience - truncate to 100 chars
  if (accountData['Quem é o cliente ideal? (Persona)']) {
    const persona = accountData['Quem é o cliente ideal? (Persona)'];
    parts.push(`Persona: ${persona.substring(0, 100)}`);
  }
  
  // Average ticket
  if (accountData['Ticket médio atual (valor médio por venda ou contrato).']) {
    parts.push(`Ticket: ${accountData['Ticket médio atual (valor médio por venda ou contrato).']}`);
  }
  
  // Competitive differentiators - truncate to 80 chars
  if (accountData['Seus principais diferenciais competitivos.']) {
    const dif = accountData['Seus principais diferenciais competitivos.'];
    parts.push(`Diferenciais: ${dif.substring(0, 80)}`);
  }
  
  // Pain points - truncate to 80 chars
  if (accountData['Quais são as maiores dores e objeções desses clientes?']) {
    const dores = accountData['Quais são as maiores dores e objeções desses clientes?'];
    parts.push(`Dores: ${dores.substring(0, 80)}`);
  }
  
  // Join with bullet separator and limit to ~480 chars total
  return parts.join(' • ').substring(0, 480);
}
