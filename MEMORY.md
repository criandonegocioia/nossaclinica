# MEMORY.md — Clínica Odontológica e Estética
# O agente atualiza este arquivo ao final de cada sessão relevante

## Decisões de arquitetura tomadas

- **Micro-Frontends para Tela de Paciente**: Refatoramos o monólito `pacientes/[id]/page.tsx` (que tinha mais de 2.000 linhas) aplicando os padrões do Next.js 14.
- As abas (`prontuario`, `fotos`, `documentos`, `anamnese`, `financeiro`, `agendamentos`) operam como componentes isolados, a maioria carregada com `React.lazy` e envolta por `Suspense` com esqueletos próprios.
- **Arquivos legados deletados**: `_legacy-forms.tsx` (1.371 linhas) e `_page-legacy.tsx` (2.501 linhas) foram removidos definitivamente após confirmação de zero referências.
- **SDD Implantado (07/05/2026)**: Estrutura Spec-Driven Development adicionada ao repositório em `.specs/`. Toda nova feature segue o ciclo SPEC → REVIEW → IMPLEMENT → DONE.

## Módulo Financeiro (refatorado 05/05/2026)

### Arquitetura do novo formulário
```
components/pacientes/financeiro/novo-lancamento/
  types.ts              → Zod schema + funções de cálculo puras (calcItemFinal, calcTotal...)
  ProcedimentosCart.tsx → Picker + tabela-carrinho com useFieldArray + desconto por item
  ResumoEAcoes.tsx      → Barra de totais + campanhas + campos pagamento + ações pós-save
  NovoLancamentoForm.tsx → Orquestrador FormProvider + reduce carrinho → payload flat

components/financeiro-geral/
  NovoLancamentoGeralForm.tsx  ← formulário da visão Clínica (renomeado de NovoLancamentoGeral)
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

## Módulo Estoque (refatorado 06/05/2026)

- Substituído `MOCK_PRODUCTS` por `useStockProducts` — dados reais do backend.
- Criada rota `/estoque/novo` como página dedicada (padrão Inline Expansion com `page-header` + botão voltar).
- `useCreateStockProduct` conectado ao formulário; `onSuccess` invalida cache `stock-products`.

## Prontuário — Agendamento de Retorno (07/05/2026)

- Campo `Data de retorno` (`nextReturn`) no `NovoAtendimentoForm` dispara criação automática de agendamento.
- Só executa em "Finalizar Atendimento" (não em rascunho).
- Payload: `{ patientId, professionalId, startAt: T08:00, endAt: T09:00, notes: "Retorno - Ref: [procedimento]" }`
- Falha no agendamento é silenciosa (try/catch) — prontuário sempre salvo.
- ADR documentado em `.specs/decisions/004-agendamento-retorno-automatico.md`.

## Problemas conhecidos / Resolvidos

- **Download de PDF**: `getApiBaseUrl()` foi corrigido para não redirecionar para `localhost:3000`.
- **Anamnese em JSON**: Desserialização adicionada para campos em String JSON.
- **Lançamentos Financeiros**: Guards do NestJS atualizados para `RECEPCAO` e `DENTISTA`.
- **Galerias de Fotos**: Reagrupamento visual por categoria implementado.
- **useProcedures**: Todos os arquivos que usavam `procsRes?.data` foram corrigidos para o padrão direto (`ApiProcedure[]`).
- **NovoLancamentoGeral**: Renomeado para `NovoLancamentoGeralForm` — import atualizado em `financeiro/page.tsx`.

## Componentes shared já criados

- `Field`, `InlineFormHeader` em `components/pacientes/shared/ui.tsx`
- Constantes globais: `INITIAL_PROCEDURE_PRICES`, `INITIAL_CAMPAIGNS`, `PHOTO_CATEGORIES`

## Hooks já implementados

- `useCreateFinance`, `useCreateDocument`, `useCreateSchedule`, `useProcedures`, `useRooms`, `useUsers`
- `useStockProducts`, `useCreateStockProduct`, `useStockAlerts`, `useCreateStockMovement`
- `useCreateMedicalRecord`, `useUpdateMedicalRecord`, `useMedicalRecords`

## Estrutura SDD (.specs/) — criada em 07/05/2026

```
.specs/
  README.md                    ← Índice e workflow
  decisions/
    001-css-proprietario-zero-tailwind.md
    002-zero-modais-inline-expansion.md
    003-workflow-multi-llm-tokens.md
    004-agendamento-retorno-automatico.md
    005-limite-120-linhas-componentes.md
    006-supabase-prisma-stack-dados.md
  features/
    _TEMPLATE.md               ← Copiar para novas features
  done/
    agendamento-retorno-automatico.md
  active/                      ← Features em implementação
```

## Última sessão

- **Data:** 07/05/2026
- **O que foi feito:**
  - Implantação completa do SDD: estrutura `.specs/`, 6 ADRs das decisões vigentes, template de feature spec.
  - Regra SDD adicionada ao `AGENTS.md` (leitura obrigatória de ADRs antes de implementar).
  - Skill `agendamento-retorno` criada em `.agents/skills/`.
  - Workflow Multi-LLM de otimização de tokens documentado em `AGENTS.md` e ADR-003.
  - Import corrigido em `financeiro/page.tsx`: `NovoLancamentoGeral` → `NovoLancamentoGeralForm`.

- **O que ficou pendente:**
  - Validar visualmente o carrinho de procedimentos em produção
  - Testar fluxo de PDF em Documentos
  - Auditoria LGPD de outras telas (CRM, HOF, Auditoria) — baixa prioridade
  - Verificar se componente `NovoLancamentoGeralForm` existe em `components/financeiro-geral/`

## Notas importantes para próximas sessões

- **PROIBIÇÃO ABSOLUTA DE TAILWINDCSS**: O projeto NÃO utiliza e NÃO suporta classes utilitárias clássicas do Tailwind (`flex`, `mb-4`, `p-2`, `bg-blue-50`). Usá-las quebra o layout.
- **Como estilizar**: Classes nativas (`.card`, `.input`, `.btn`, `.grid-2`) + **inline styles** com variáveis CSS para o restante.
- **Classes disponíveis (`globals.css`)**: `.card`, `.card-body`, `.input`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.table`, `.table-container`, `.input-group`, `.input-label`, `.grid`, `.grid-2`, `.badge`, `.spinner`, `.avatar`.
- **Limite de 120 linhas** por arquivo de componente (ADR-005)
- **Cálculos financeiros**: lógica pura em `types.ts`, não inline no componente
- **Banco de Dados (Produção)**: Supabase. Migrations aplicadas via SQL Editor do Supabase ou CLI com `DATABASE_URL` correta.
- **SDD obrigatório**: Antes de qualquer nova feature, verificar `.specs/active/` e ler ADRs relevantes em `.specs/decisions/`.