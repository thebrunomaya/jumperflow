# Jumper Flow - Claude Configuration

> **Versão:** v2.2.6 | **Atualizado:** 2026-01-23

---

## 🔴 REGRAS OBRIGATÓRIAS

### 1. Consultar Documentação

**SEMPRE consultar no INÍCIO e FINAL de cada sessão:**

| Documento | Verificar |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Estado atual do sistema, patterns, schema |
| `docs/ROADMAP.md` | Próximos passos, prioridades, o que já foi feito |

**Se fizer alterações, ATUALIZAR os documentos para refletir as mudanças.**

### 2. Arquivos de Teste

**TODOS os arquivos de teste devem ser salvos em `tmp-tests/`:**
```bash
tmp-tests/
├── test-*.ts        # Scripts de teste Deno/Node
├── *.test.ts        # Testes unitários
└── debug-*.ts       # Scripts de debug
```

**NUNCA criar arquivos de teste na raiz do projeto.**

### 3. Arquivos Temporários do Usuário

Arquivos temporários do usuário vão em `tmp-user/` (gitignored).

---

## 📖 Documentação

| Documento | Conteúdo |
|-----------|----------|
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Schema, Edge Functions, Patterns, Sistemas |
| **[docs/ROADMAP.md](docs/ROADMAP.md)** | Próximos passos e planejamento |
| **[docs/FUNCTIONS.md](docs/FUNCTIONS.md)** | Funções operacionais (localdev, alertas, etc) |
| **[.claude-context](.claude-context)** | Contexto temporário (últimos 7 dias) |

---

## 📋 Project Overview

### **Jumper Flow Platform - Briefing Estratégico**

**🎯 OBJETIVO PRINCIPAL:** TORNAR-SE O HUB COMPLETO de gestores de tráfego, gerentes parceiros e clientes finais da Jumper Studio para **democratizar serviços de tráfego pago**.

**📍 Missão Atual:** Sistema de criativos ✅ + Sistema resiliente ✅ + 12 Dashboards ✅ + **Decks System** ✅ + **Optimization System** ✅ + **Dashboards Multi-Platform** ✅ + **Gestão de Contas** 🚧

**🚀 Visão Futura:** Plataforma self-service que reduz trabalho operacional e permite preços mais baixos

---

## 👥 Usuários do Sistema

| Role | % | Descrição | Acesso |
|------|---|-----------|--------|
| **Admin** | 5% | Desenvolvedores, debugging | Total |
| **Staff** | 10% | Gestores de tráfego Jumper | Contas atribuídas |
| **Client** | 85% | Gerentes de marketing parceiros | Suas contas |

---

## 🏗️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **Hosting**: Vercel (flow.jumper.studio)
- **Integration**: Notion API, Windsor.ai
- **State**: React Query (@tanstack/react-query)

---

## 🛠️ Local Development

**Guia completo:** [localdev/README.md](localdev/README.md)

```bash
./localdev.sh   # Menu interativo com todas as opções
```

**Credenciais:** `bruno@jumper.studio` / `senha123`

---

## ⚠️ Padrões Críticos

### Account Access Pattern

**SEMPRE usar:**
```typescript
const { accounts } = useMyNotionAccounts();
```

**NUNCA fazer:**
```typescript
// ❌ ERRADO - Bypassa permissões
supabase.from('j_hub_notion_db_accounts').select('*')
```

### Account ID System

> **Atualizado 2026-01-22:** Todas as tabelas agora usam UUID consistentemente.

| Tabela | FK |
|--------|---|
| `j_hub_decks` | UUID → `j_hub_notion_db_accounts(id)` |
| `j_hub_optimization_recordings` | UUID → `j_hub_notion_db_accounts(id)` |

**Ver:** [ARCHITECTURE.md - Account ID System](docs/ARCHITECTURE.md#️-account-id-system)

---

## 🔧 Comandos Essenciais

```bash
# Desenvolvimento
npm run dev              # Dev server
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm run build            # Build

# Database
./localdev.sh            # Menu completo
./localdev/4-quick-reset.sh  # Reset rápido
```

---

## 📦 Versioning

**Arquivo:** `src/config/version.ts`

- **PATCH:** Auto-incrementado por Claude em cada commit
- **MINOR/MAJOR:** Apenas quando usuário solicitar

---

## 🖥️ CLI Policy

**SEMPRE usar CLI:**
- ✅ `npx supabase` para Supabase
- ✅ `gh` para GitHub
- ✅ `git` para version control

**NUNCA instruir usar interfaces web.**

---

## 🚀 Deployment

### Git Remote
```bash
git push origin main  # ✅ Produção - repo jumperflow
```

### Frontend (Automático)
```bash
git push origin main  # Vercel auto-deploys
```

### Edge Functions (Manual)
```bash
npx supabase functions deploy <function> --project-ref biwwowendjuzvpttyrlb
```

### ⚠️ Comandos que Afetam Produção

Requerem **DUPLA confirmação**:
- `supabase db push`
- `supabase functions deploy`
- `supabase secrets set`

---

## 🔄 Session Protocol

### Início de Sessão

1. Ler `.claude-context` para contexto recente
2. Ler `docs/ARCHITECTURE.md` para arquitetura atual
3. Ler `docs/ROADMAP.md` para próximos passos e prioridades
4. Confirmar com usuário o que precisa ser feito

### Fim de Sessão

Quando usuário disser "encerrar", "acabou", "tchau":

1. **Atualizar `.claude-context`** com:
   - O que foi feito
   - Issues pendentes
   - Próximos passos

2. **Verificar `docs/ARCHITECTURE.md`**:
   - Documento ainda está válido?
   - Se alterou sistema, atualizar doc

3. **Verificar `docs/ROADMAP.md`**:
   - Atualizar status de itens concluídos
   - Adicionar novos itens identificados

---

## 💰 Impacto Estratégico

Este é um **PRODUTO ESTRATÉGICO** que vai:

1. **Redefinir** o modelo de negócio da Jumper
2. **Democratizar** acesso a tráfego pago de qualidade
3. **Transformar** agências de conteúdo em parceiras eficientes
4. **Escalar** serviços para cliente final com preços baixos

---

**Last Updated:** 2026-01-25
**Maintained by:** Claude Code Assistant
