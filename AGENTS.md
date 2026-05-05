# AGENTS.md — Clínica Odontológica e Estética
# Lido automaticamente por todos os agentes neste workspace

## Identidade do projeto
- **Sistema**: Gestão de clínica odontológica (Clinica Odontologica e Estetica)
- **Stack**: Next.js 14 App Router · TypeScript · TailwindCSS · NestJS · PostgreSQL/Prisma
- **Monorepo**: apps/web (frontend) · apps/api (backend) · shared/

## Regras permanentes de arquitetura

Todo código gerado neste projeto DEVE seguir:

1. **Decomposição**: Nenhum arquivo de página (page.tsx) deve ter mais de 120 linhas.
   Cada domínio (aba/módulo) = componente isolado em components/[modulo]/index.tsx
2. **Client vs Server**: Usar Server Components por padrão.
   Usar "use client" APENAS quando há interatividade (hooks, eventos, estado local)
3. **Code splitting**: Toda aba de paciente usa React.lazy + Suspense com skeleton próprio
4. **Tipos**: Cada componente exporta seus tipos de um arquivo co-localizado types.ts
5. **Hooks**: Toda chamada de API fica em hooks/use[Dominio].ts — nunca inline no componente

## Regras permanentes de UX/Design

Usar @frontend-design + @ui-skills como base para qualquer interface:

- Spacing: sistema de 8pt (4, 8, 12, 16, 24, 32, 48, 64px)
- Tipografia: hierarquia de 3 níveis (heading/body/caption), nunca tamanho < 13px
- Cores: definir tokens no tailwind.config antes de aplicar nos componentes
- Acessibilidade: toda interação deve ter aria-label, focus-visible ring, contraste AA
- Feedback de estado: todo botão/form precisa de loading, error e success states
- Após qualquer geração de interface rodar @web-design-guidelines para auditoria

## Regras permanentes de segurança

- Dados sensíveis (CPF, prontuário, anamnese, financeiro) = classificação LGPD Sensível
- Nunca armazenar tokens JWT em localStorage — apenas httpOnly cookies
- Todo endpoint de paciente precisa de auth guard verificado
- Nenhum dado de paciente no console.log em qualquer ambiente

## Skills padrão por tipo de tarefa

| Tarefa                        | Skills a usar                                    |
|-------------------------------|--------------------------------------------------|
| Criar/refatorar componente    | @architecture @react-patterns @frontend-design   |
| Novo design / UI              | @frontend-design @ui-skills @interaction-design  |
| Auditoria de interface        | @web-design-guidelines @senior-frontend           |
| Sistema de componentes shared | @composition-patterns @senior-frontend            |
| Segurança / LGPD              | @security-auditor                                |
| Planejamento macro            | @senior-architect @architecture                  |
| Performance / bundle          | @senior-frontend @typescript-expert              |

## Contexto das telas existentes

Screens no sidebar: auditoria · configuracoes · crm · documentos · estoque
                    financeiro · fotos · hof · medicamentos · pacientes · relatorios

Tela prioritária para refatoração: pacientes/[id]/page.tsx (2285 linhas → meta: <120)
Estrutura de abas do paciente: prontuario · fotos · documentos · anamnese · financeiro · agendamentos

## Convenção de pastas

components/
  pacientes/
    prontuario/          ← index.tsx + types.ts + loading.tsx
    fotos/
    documentos/
    anamnese/
    financeiro/
    agendamentos/
  auditoria/
  configuracoes/
  crm/
  estoque/
  financeiro/
  hof/
  medicamentos/
  relatorios/
  shared/                ← componentes reutilizados em 2+ telas
    DataTable/           ← tabela genérica com paginação e filtros
    ConfirmDialog/       ← modal de confirmação padrão
    StatusBadge/         ← badge de status reutilizável
    PageHeader/          ← cabeçalho de tela com título e ações
    EmptyState/          ← estado vazio padronizado
    FormField/           ← campo de formulário com label + erro

hooks/
  pacientes/
    usePaciente.ts             ← CRUD do paciente
    useProntuario.ts           ← prontuário clínico
    useAnamnese.ts             ← ficha de anamnese
    useFotos.ts                ← galeria de fotos clínicas
    useDocumentos.ts           ← documentos do paciente
    useFinanceiroPaciente.ts   ← financeiro por paciente
    useAgendamento.ts          ← agendamentos do paciente
  sistema/
    useAuditoria.ts            ← logs e auditoria do sistema
    useConfiguracoes.ts        ← configurações gerais da clínica
    useCrm.ts                  ← gestão de relacionamento e leads
    useEstoque.ts              ← controle de estoque de materiais
    useFinanceiro.ts           ← financeiro geral da clínica
    useHof.ts                  ← histórico de ocorrências
    useMedicamentos.ts         ← cadastro e controle de medicamentos
    useRelatorios.ts           ← geração e exportação de relatórios
  shared/
    useAuth.ts                 ← autenticação e sessão
    usePagination.ts           ← paginação genérica reutilizável
    useDebounce.ts             ← debounce para inputs de busca
    useToast.ts                ← notificações globais

## Memória entre sessões

- Ao iniciar: leia MEMORY.md para recuperar contexto da sessão anterior
- Ao finalizar: atualize MEMORY.md com decisões tomadas, problemas encontrados
  e o que ficou pendente