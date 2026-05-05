# MEMORY.md — Clínica Odontológica e Estética
# O agente atualiza este arquivo ao final de cada sessão relevante

## Decisões de arquitetura tomadas
- **Micro-Frontends para Tela de Paciente**: Refatoramos o monólito `pacientes/[id]/page.tsx` (que tinha mais de 2.000 linhas) aplicando os padrões do Next.js 14.
- As abas (`prontuario`, `fotos`, `documentos`, `anamnese`, `financeiro`, `agendamentos`) agora operam como componentes isolados, em sua maioria carregados com `React.lazy` e envoltos por um `Suspense` com seus respectivos `loading.tsx` (esqueletos).
- Arquivos de form de inserção (como `BudgetBuilder`, `NewDocumentInline`, `NewFinanceInline`, `NewScheduleInline`) foram corrigidos para manter o correto escape de Template Strings que quebravam o build de Client Components.

## Problemas conhecidos / Resolvidos
- **Download de PDF:** O utilitário `getApiBaseUrl()` foi corrigido no frontend para não redirecionar URLs de assets gerados para `localhost:3000` na visualização/download de PDFs, apontando corretamente para o servidor NestJS na porta `3001` nos ambientes de desenvolvimento.
- **Anamnese em JSON:** Adicionado o processamento para desserializar corretamente campos em String JSON, que antes quebravam a tela se exibidos com status "preenchida".
- **Lançamentos Financeiros e Permissões:** Atualizados os "guards" do NestJS na controller de finanças (`FinanceController`) para habilitar adequadamente acesso às funções de inserção/edição pelos papéis `RECEPCAO` e `DENTISTA`.
- **Galerias de Fotos:** Refatoradas para agrupar visualmente fotos por categoria com UX aprimorado. 

## Componentes shared já criados
- **UI de Paciente**: `Field`, `InlineFormHeader`, constantes globais como `ProcedurePrice`, `PHOTO_CATEGORIES`.

## Hooks já implementados
- Diversos endpoints na camada de cliente e hooks da API no modelo padrão (`useCreateFinance`, `useCreateDocument`, `useCreateSchedule`, etc).

## Última sessão
- **Data:** 05/05/2026
- **O que foi feito:**
  - Diagnóstico e reparação de erros cruciais de lint e TypeScript (`TS1127`, `TS1005`, `TS2304`) causados por quebras e escapes indevidos de backticks (` \` `) e cifrões (` \$ `) em interpolações do React (como no form de geração de PDFs).
  - Testes do compilador do TypeScript validados 100% de sucesso sem erros de sintaxe ou tipagem.
  - Subida do Backend e Frontend via `pnpm dev` em background e estabilização de rotas.
- **O que ficou pendente:**
  - O usuário precisa validar visualmente no navegador as novas abas de fotos, prontuários, e confirmar o fluxo de Imprimir/Salvar PDF para fechar essa sprint.
  - Auditar futuramente outras páginas além da tela do paciente se seguem a regra LGPD e ausência de localStorage para JWT.