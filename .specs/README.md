# .specs — Spec-Driven Development (SDD)

Este diretório implementa o fluxo **Spec-Driven Development** no projeto Clínica Odontológica e Estética.

## Estrutura

```
.specs/
  decisions/     ← ADRs (Architecture Decision Records) — decisões permanentes
  features/      ← Specs de features (DRAFT → REVIEW → APPROVED)
  active/        ← Features em desenvolvimento ativo
  done/          ← Features concluídas (histórico imutável)
```

## Workflow SDD

```
1. SPEC DRAFT     → Criar arquivo em features/ usando _TEMPLATE.md
2. SPEC REVIEW    → Revisar critérios de aceitação e contrato de dados
3. SPEC APPROVED  → Mover para active/ e iniciar implementação
4. IMPLEMENTATION → Antigravity gera implementation_plan.md + task.md
5. DONE           → Mover para done/ após verification
```

## Regras

1. **Nenhuma feature nova sem spec aprovada**
2. **ADRs são imutáveis** — para reverter uma decisão, crie um novo ADR (ex: `007-reverter-001.md`)
3. **Specs em `done/` não são editadas** — são histórico de decisão
4. **Agentes leem `.specs/decisions/` antes de implementar** para respeitar ADRs vigentes

## ADRs Vigentes

| # | Decisão | Status |
|---|---|---|
| [ADR-001](decisions/001-css-proprietario-zero-tailwind.md) | CSS Proprietário — Zero TailwindCSS | ✅ ACCEPTED |
| [ADR-002](decisions/002-zero-modais-inline-expansion.md) | Zero Modais — Padrão Inline Expansion | ✅ ACCEPTED |
| [ADR-003](decisions/003-workflow-multi-llm-tokens.md) | Workflow Multi-LLM para Tokens | ✅ ACCEPTED |
| [ADR-004](decisions/004-agendamento-retorno-automatico.md) | Agendamento Automático de Retorno | ✅ ACCEPTED |
| [ADR-005](decisions/005-limite-120-linhas-componentes.md) | Limite 120 Linhas por Componente | ✅ ACCEPTED |
| [ADR-006](decisions/006-supabase-prisma-stack-dados.md) | Supabase + Prisma como Stack de Dados | ✅ ACCEPTED |

## Como Criar uma Nova Feature

1. Copie `features/_TEMPLATE.md` para `features/[nome-da-feature].md`
2. Preencha todos os campos
3. Peça revisão ao time
4. Após aprovação, mova para `active/`
5. Solicite implementação ao Antigravity com: `"Implemente a spec active/[nome].md"`

## Como Criar um Novo ADR

Crie `decisions/00N-[slug].md` com o formato:
```markdown
# ADR-00N: Título
**Status**: PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED by ADR-00X
**Data**: YYYY-MM-DD

## Contexto
## Decisão
## Alternativas Rejeitadas
## Consequências
```
