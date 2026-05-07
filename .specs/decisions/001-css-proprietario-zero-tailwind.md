# ADR-001: Sistema CSS Proprietário — Zero TailwindCSS
**Status**: ACCEPTED  
**Data**: 2026-04-20  
**Contexto**: Projeto Clínica Odontológica e Estética

---

## Contexto

O projeto iniciou com TailwindCSS mas as classes utilitárias geraram conflitos graves
com o sistema visual da clínica (cores de marca, tipografia, espaçamento 8pt grid).
Misturar dois sistemas de estilo criava inconsistências visuais e dificultava manutenção.

## Decisão

**Banimento total e irrevogável** do TailwindCSS em todo o projeto.  
O sistema de estilização é exclusivamente:

1. **Classes globais** definidas em `globals.css`:
   - Layout: `.card`, `.card-body`, `.grid`, `.grid-2`
   - Formulários: `.input`, `.input-group`, `.input-label`
   - Ações: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`
   - Dados: `.table`, `.table-container`, `.badge`, `.spinner`, `.avatar`

2. **Inline styles** com variáveis CSS nativas para casos não cobertos pelas classes:
   ```tsx
   style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
   ```

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| Manter TailwindCSS | Conflitos de especificidade, inconsistência visual |
| CSS Modules por componente | Sobrecarga de arquivos, duplicação de tokens |
| Styled Components | Overhead de runtime, incompatível com Server Components |

## Consequências

- ✅ Visual 100% consistente com a marca da clínica
- ✅ Agentes de IA têm contratos claros de classes disponíveis
- ✅ Zero conflito de especificidade CSS
- ⚠️ Agentes devem verificar `globals.css` antes de estilizar
- ⚠️ Qualquer classe Tailwind detectada = **bug crítico**

## Regra de Verificação

Antes de qualquer PR, executar:
```bash
grep -r "className=\"[^\"]*\(flex\|p-[0-9]\|m-[0-9]\|text-\|bg-\|border-\)" apps/web/src/components
```
Resultado esperado: zero ocorrências.
