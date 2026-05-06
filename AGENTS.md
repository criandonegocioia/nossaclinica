# AGENTS.md — Clínica Odontológica e Estética
# Lido automaticamente por todos os agentes neste workspace

## Identidade do Projeto
- **Sistema**: Gestão de clínica odontológica (Clinica Odontologica e Estetica)
- **Stack**: Next.js 14 App Router · TypeScript · TailwindCSS · NestJS · Supabase/Prisma
- **Monorepo**: apps/web (frontend) · apps/api (backend) · shared/

## Regras Permanentes de Arquitetura
Todo código gerado neste projeto DEVE seguir:

- **Decomposição Limitada**: Nenhum arquivo de componente ou página (`page.tsx`) deve ultrapassar 120 linhas. Cada domínio (aba/módulo) representa um componente isolado em `components/[modulo]/index.tsx`.
- **Client vs Server**: Utilize Server Components por padrão. Reserve a diretiva `"use client"` estritamente para o escopo que exige interatividade (hooks do React, eventos do DOM, estado local).
- **Code Splitting e Loading**: Toda aba de paciente utiliza `React.lazy` + `Suspense` acompanhada de um componente skeleton próprio.
- **Isolamento de Tipos**: Cada componente exporta suas interfaces de um arquivo co-localizado `types.ts`.
- **Hooks de Domínio**: Toda mutação ou consulta de API reside em `hooks/use[Dominio].ts`. A lógica de requisição nunca é declarada inline nos componentes de UI.

## Regras de Formulários e Contratos de Dados
- **Gerenciamento de Estado**: Formulários utilizam obrigatoriamente `react-hook-form` para minimizar o ciclo de re-renderizações em campos dinâmicos.
- **Validação E2E**: Utilize `Zod` para validação rigorosa. Os schemas (ex: `pacienteSchema.ts`) devem residir no diretório `shared/` do monorepo para consumo unificado: no NestJS via pipes e no Next.js via resolvers.
- **Tipagem Inferred**: A duplicação de tipagens de DTOs é estritamente proibida. O frontend infere os tipos a partir dos schemas Zod ou dos tipos gerados pelo Prisma presentes no `shared/`.

## Regras de Tratamento de Erros e Testes
- **Resiliência Frontend**: Falhas em chamadas de API são tratadas nativamente por Error Boundaries no nível de rota ou via componentes padronizados (`useToast`) para erros de formulário.
- **Respostas Backend**: O NestJS adota um padrão determinístico de erro (formato RFC 7807 Problem Details ou equivalente estruturado). O frontend propaga a causa raiz técnica para os logs e exibe mensagens sanitizadas ao usuário, sem mascarar falhas sistêmicas.
- **Isolamento de Lógica Pura**: Algoritmos de precificação, regras de agendamento e transformações de dados residem em funções utilitárias puras (ex: `utils/financeiro.ts`), fora do ciclo de vida do React.
- **Testabilidade**: Lógicas utilitárias complexas requerem casos de teste unitários determinísticos antes da integração à interface.

## Regras Permanentes de Segurança e LGPD
- **Classificação de Dados**: Dados sensíveis (CPF, prontuário, anamnese, financeiro) operam sob classificação LGPD Sensível.
- **Gerenciamento de Sessão**: É vetado o armazenamento de tokens JWT em `localStorage`. A persistência ocorre exclusivamente via cookies `httpOnly` e `Secure`.
- **Controle de Acesso**: Todo endpoint restrito exige *auth guard* e validação de RBAC (Role-Based Access Control).
- **Ofuscação Padrão (Obfuscation by Default)**: Interfaces que exibem dados críticos (CPF, receita global) implementam mecanismos de "ocultar/revelar" visibilidade nativamente.
- **Proteção de PII**: Identificadores PII (Personally Identifiable Information) não trafegam em URLs (Query Params). Consultas complexas utilizam payload de body em requisições POST.

## Regras Permanentes de UX/Design
- **Proibição Estrita de TailwindCSS**: O projeto utiliza um sistema CSS proprietário. É **ESTRITAMENTE PROIBIDO** utilizar classes utilitárias típicas do TailwindCSS (`flex`, `p-4`, `mb-2`, `text-center`, etc). O uso dessas classes resultará em falhas graves de layout.
- **Sistema de Classes e Inline Styles**: Utilize as classes globais estabelecidas (`.card`, `.input`, `.btn`, `.btn-primary`, `.grid-2`, etc). Para alinhamentos ou espaçamentos que não possuam classe definida, aplique **inline styles** usando as variáveis nativas (ex: `style={{ display: 'flex', gap: '8px', padding: 'var(--space-4)' }}`).
- **Tipografia**: Manutenção de hierarquia em três níveis (heading/body/caption), vetando tamanhos de fonte inferiores a 13px.
- **Acessibilidade Absoluta**: Toda área interativa demanda `aria-label`, anéis de foco visíveis (`focus-visible ring`) e contraste compatível com a diretriz AA.
- **Feedback de Estado Multidimensional**: Elementos de ação (botões/formulários) mapeiam explicitamente os estados `loading`, `error`, `success` e `disabled`.

## Skills Padrão por Escopo de Tarefa

| Escopo da Tarefa | Skills Obrigatórias |
| :--- | :--- |
| Criar/Refatorar Componente (Server) | `@nextjs` `@architecture` |
| Criar/Refatorar Formulário (Client) | `@nextjs` `@react-hook-form` `@typescript-expert` |
| Validar/Criar Contratos API | `@nestjs` `@zod` `@typescript-expert` |
| Modelagem de Banco de Dados | `@prisma` `@postgres` `@senior-architect` |
| Novo Design / Componente UI | `@frontend-design` `@interaction-design` (Zero Tailwind) |
| Segurança, Autenticação e LGPD | `@security-auditor` |
| Auditoria de Interface | `@web-design-guidelines` `@senior-frontend` |

## Convenção de Diretórios
```text
components/
  pacientes/
    prontuario/          ← index.tsx + types.ts + loading.tsx
    fotos/
    documentos/
    anamnese/
    financeiro/
    agendamentos/
  shared/                ← componentes reutilizados em 2+ telas
    DataTable/           ← tabela genérica com paginação e filtros
    ConfirmDialog/       ← modal de confirmação padrão
    StatusBadge/         ← badge de status reutilizável
    PageHeader/          ← cabeçalho de tela com título e ações
    EmptyState/          ← estado vazio padronizado
    FormField/           ← campo de formulário com label + erro

hooks/
  pacientes/
    usePaciente.ts             ← CRUD de entidade principal
    useFinanceiroPaciente.ts   ← Mutações financeiras
  shared/
    useAuth.ts                 ← Autenticação e sessão
    useToast.ts                ← Notificações globais