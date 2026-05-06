# MEMORY.md — Clínica Odontológica e Estética
# O agente atualiza este arquivo ao final de cada sessão relevante

## Decisões de arquitetura tomadas

- **Micro-Frontends para Tela de Paciente**: Refatoramos o monólito `pacientes/[id]/page.tsx` (que tinha mais de 2.000 linhas) aplicando os padrões do Next.js 14.
- As abas (`prontuario`, `fotos`, `documentos`, `anamnese`, `financeiro`, `agendamentos`) operam como componentes isolados, a maioria carregada com `React.lazy` e envolta por `Suspense` com esqueletos próprios.
- **Arquivos legados deletados**: `_legacy-forms.tsx` (1.371 linhas) e `_page-legacy.tsx` (2.501 linhas) foram removidos definitivamente após confirmação de zero referências.

## Módulo Financeiro (refatorado 05/05/2026)

### Arquitetura do novo formulário
```
components/pacientes/financeiro/novo-lancamento/
  types.ts              → Zod schema + funções de cálculo puras (calcItemFinal, calcTotal...)
  ProcedimentosCart.tsx → Picker + tabela-carrinho com useFieldArray + desconto por item
  ResumoEAcoes.tsx      → Barra de totais + campanhas + campos pagamento + ações pós-save
  NovoLancamentoForm.tsx → Orquestrador FormProvider + reduce carrinho → payload flat
```

### Regras de negócio implementadas
- Desconto individual por procedimento (%, R$ fixo, ou nenhum)
- Desconto global sobre subtotal (%, R$ fixo)
- Campanhas promocionais (filtradas por data ativa)
- `onSubmit` reduce itens → `description` concatenada + `amount` total para mutation
- Pós-save: botões de PDF, E-mail, WhatsApp

## Endpoint de Procedimentos (backend)

- **Criado**: `GET /schedules/procedures` no `SchedulingController` do NestJS
- **Serviço**: `SchedulingService.findProcedures()` busca tabela `Procedure` com filtros `active` e `category`
- **Hook**: `useProcedures()` em `useApi.ts` — URL correta, retorno tipado `ApiProcedure[]`, `staleTime: 5min`
- **Interface `ApiProcedure`**: `id`, `code`, `name`, `priceDefault`, `category`, `colorCode`, `active`, `durationDefault?`

## Problemas conhecidos / Resolvidos

- **Download de PDF**: `getApiBaseUrl()` foi corrigido para não redirecionar para `localhost:3000`.
- **Anamnese em JSON**: Desserialização adicionada para campos em String JSON.
- **Lançamentos Financeiros**: Guards do NestJS atualizados para `RECEPCAO` e `DENTISTA`.
- **Galerias de Fotos**: Reagrupamento visual por categoria implementado.
- **useProcedures**: Todos os arquivos que usavam `procsRes?.data` foram corrigidos para o padrão direto (`ApiProcedure[]`).

## Componentes shared já criados

- `Field`, `InlineFormHeader` em `components/pacientes/shared/ui.tsx`
- Constantes globais: `INITIAL_PROCEDURE_PRICES`, `INITIAL_CAMPAIGNS`, `PHOTO_CATEGORIES`

## Hooks já implementados

- `useCreateFinance`, `useCreateDocument`, `useCreateSchedule`, `useProcedures`, `useRooms`, `useUsers`, etc.

## Última sessão

- **Data:** 05/05/2026
- **O que foi feito:**
  - Implementação completa do módulo `NovoLancamentoForm` (Zod + react-hook-form + useFieldArray)
  - Criação do endpoint `/schedules/procedures` no NestJS
  - Tipagem de `useProcedures()` com `ApiProcedure[]` e fallback mock
  - Remoção de `NewFinanceInline.tsx`, `_legacy-forms.tsx`, `_page-legacy.tsx`
  - TypeScript: `Exit code: 0` — zero erros em todo o frontend
  - 4 commits + push

- **O que ficou pendente:**
  - Validar visualmente o novo carrinho em produção (badge `✓ N procedimentos do banco`)
  - Testar fluxo de PDF em Documentos
  - Auditoria LGPD de outras telas (CRM, HOF, Auditoria) — baixa prioridade

## Notas importantes para próximas sessões

- **NÃO usar TailwindCSS** — o projeto usa design system CSS customizado com variáveis (`globals.css`)
- **Classes disponíveis**: `.card`, `.card-body`, `.input`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.table`, `.table-container`, `.input-group`, `.input-label`, `.grid`, `.grid-2`, `.badge`, `.spinner`, `.avatar`
- **Limite de 120 linhas** por arquivo de componente (regra do AGENTS.md)
- **Cálculos financeiros**: lógica pura em `types.ts`, não inline no componente
- **Banco de Dados (Produção)**: O banco de dados de produção está hospedado no **Supabase**. Migrations que afetam produção (como a de cancelamento do financeiro) devem ser aplicadas através do SQL Editor do Supabase ou via CLI com a `DATABASE_URL` correta do Supabase.