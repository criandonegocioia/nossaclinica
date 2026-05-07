# Template de Feature Spec — Clínica Odontológica e Estética
# Copie este arquivo para `.specs/active/[nome-da-feature].md` e preencha

**Status**: DRAFT  
**Data**: YYYY-MM-DD  
**Solicitante**: [quem pediu]  
**Prioridade**: ALTA | MÉDIA | BAIXA

---

## 1. Objetivo

> O que essa feature resolve? Por que é necessária agora?

## 2. Critérios de Aceitação

> Liste comportamentos observáveis e testáveis. Cada item deve ser verificável.

- [ ] Critério 1: [ação do usuário] → [resultado esperado]
- [ ] Critério 2: [ação do usuário] → [resultado esperado]
- [ ] Critério 3: [caso de erro] → [mensagem/comportamento esperado]

## 3. Contrato de Dados (API)

> Descreva os endpoints, payloads e respostas. Base para o backend NestJS.

```
Método: POST | GET | PATCH | DELETE
Endpoint: /[recurso]
Auth: Sim (roles: ADMIN | DENTISTA | RECEPÇÃO)

Payload:
{
  campo1: string,
  campo2: number
}

Resposta de sucesso (2xx):
{
  id: string,
  ...
}

Erros esperados:
- 400: [motivo]
- 403: [motivo]
- 409: [motivo — ex: conflito de horário]
```

## 4. Regras de Negócio

> Restrições, validações e lógica que o código deve implementar.

- RN-01: [regra]
- RN-02: [regra]

## 5. Componentes Afetados

> Liste os arquivos que serão criados ou modificados.

**Novos:**
- `apps/web/src/app/(dashboard)/[rota]/page.tsx`
- `apps/web/src/components/[modulo]/index.tsx`

**Modificados:**
- `apps/web/src/hooks/useApi.ts` — adicionar hook `use[Feature]`
- `apps/api/src/modules/[modulo]/[modulo].service.ts`

## 6. Decisões de Design (UX)

> Qual padrão UX será usado (referência ADR-002)?

- [ ] Inline Expansion (formulário expande na mesma página)
- [ ] Página Dedicada (`/[modulo]/novo` com botão voltar)

Mockup ou referência: [link ou descrição]

## 7. Decisões Arquiteturais

> Alguma decisão específica desta feature que precisa ser documentada?

## 8. Verificação (Definition of Done)

> Como saberemos que está pronto?

- [ ] Build sem erros TypeScript
- [ ] Critérios de aceitação validados manualmente
- [ ] Sem classes Tailwind introduzidas (ADR-001)
- [ ] Nenhum arquivo acima de 120 linhas (ADR-005)
- [ ] Dados persistindo no Supabase em produção

---

**Após aprovação:** Mover para `.specs/active/` e iniciar implementação.  
**Após conclusão:** Mover para `.specs/done/`.
