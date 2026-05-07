# ADR-005: Decomposição de Componentes — Limite de 120 Linhas
**Status**: ACCEPTED  
**Data**: 2026-04-20  
**Contexto**: Projeto Clínica Odontológica e Estética

---

## Contexto

O arquivo `pacientes/[id]/page.tsx` chegou a **2.500+ linhas** misturando lógica de API,
estado, UI e todas as abas do paciente num único componente. Isso tornava impossível:
- Navegar e entender o código
- Fazer code splitting eficiente
- Aplicar lazy loading por aba
- Testar componentes isoladamente

## Decisão

**Limite estrito de 120 linhas** por arquivo de componente ou página (`page.tsx`).

### Estrutura de Decomposição

Cada domínio (aba/módulo) vira um componente isolado:

```
components/pacientes/[dominio]/
  index.tsx       ← Componente principal (≤ 120 linhas)
  types.ts        ← Interfaces, enums, schemas Zod
  loading.tsx     ← Skeleton de carregamento
```

### Padrão de Lazy Loading Obrigatório

```tsx
// page.tsx de paciente
const Prontuario = React.lazy(() => import('@/components/pacientes/prontuario'));
const Financeiro = React.lazy(() => import('@/components/pacientes/financeiro'));

<Suspense fallback={<ProntuarioLoading />}>
  <Prontuario patientId={id} />
</Suspense>
```

### Regra de Extração

Quando um componente ultrapassa 120 linhas, extrair nessa ordem:
1. Lógica de API → hook `use[Dominio].ts`
2. Subformulários → componente filho `[Nome]Form.tsx`
3. Seções visuais → componente filho `[Nome]Section.tsx`

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| Limite de 200 linhas | Ainda muito grande para IA navegar eficientemente |
| Sem limite (julgamento subjetivo) | Deriva inevitável para arquivos grandes |
| Separar só quando "necessário" | Critério subjetivo que nunca é aplicado |

## Consequências

- ✅ Agentes de IA conseguem ler cada arquivo em contexto completo
- ✅ Code splitting automático por aba do paciente
- ✅ Testabilidade unitária por componente
- ✅ Git diffs legíveis (sem arquivos de 2k linhas)
- ⚠️ Mais arquivos para gerenciar
- ⚠️ Imports mais verbosos (compensado pela clareza)
