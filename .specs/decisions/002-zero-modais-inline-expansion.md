# ADR-002: Padrão Inline Expansion — Zero Modais no Sistema
**Status**: ACCEPTED  
**Data**: 2026-05-05  
**Contexto**: Projeto Clínica Odontológica e Estética

---

## Contexto

A versão inicial do sistema utilizava modais (`<dialog>`, overlays) para formulários
de criação e edição (ex: novo paciente, novo lançamento, novo produto). Isso gerou
problemas de:

- Acessibilidade (foco, screen readers)
- Usabilidade em telas menores
- Conflito de z-index com outros elementos
- Dificuldade de navegação e histórico do browser

## Decisão

**Nenhum modal no sistema.** Toda operação de criação/edição abre em página dedicada
ou por expansão inline dentro do card da listagem.

### Padrão "Inline Expansion" (formulários dentro da mesma página)

```
┌─────────────────────────────────────┐
│  card-header: Título + Botão Voltar │
├─────────────────────────────────────┤
│  form fields (grid-2)               │
│                                     │
│  [Cancelar] [Rascunho] [Finalizar]  │
└─────────────────────────────────────┘
```

### Padrão "Página Dedicada" (rotas separadas)

Para entidades principais (estoque, pacientes), abrir `/[modulo]/novo` como rota Next.js
com `page-header` com botão de voltar via `router.back()`.

### Referência de Implementação

O módulo **Financeiro** é o padrão-ouro:
- Listagem: `financeiro/index.tsx`  
- Novo lançamento: expande inline com `InlineFormHeader`
- Componente header: `components/pacientes/shared/ui.tsx → InlineFormHeader`

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| Modais com `<dialog>` | Acessibilidade ruim, conflito z-index, sem histórico |
| Drawer/Sidebar lateral | Complexidade extra, sem ganho real de UX |
| Página separada para tudo | Overhead de navegação para formulários pequenos |

## Consequências

- ✅ Navegação linear e previsível
- ✅ Histórico do browser funcional
- ✅ Acessibilidade nativa (sem trap de foco)
- ✅ Padrão único reduz decisões do agente
- ⚠️ Formulários grandes precisam de scroll na própria página
