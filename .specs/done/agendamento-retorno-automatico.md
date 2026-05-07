# Spec: Agendamento Automático de Retorno
**Status**: DONE  
**Data**: 2026-05-07  
**Solicitante**: Dra. Maria de Lourdes  
**Prioridade**: ALTA

---

## 1. Objetivo

Ao finalizar um atendimento, o dentista informa a data de retorno do paciente.
O sistema deve criar automaticamente o agendamento na agenda, sem exigir ação manual
da secretária, mantendo a rastreabilidade com o procedimento realizado.

## 2. Critérios de Aceitação

- [x] Ao preencher "Data de retorno" e clicar em "Finalizar Atendimento", um agendamento é criado automaticamente
- [x] O agendamento referencia o(s) procedimento(s) realizado(s) no campo `notes`
- [x] Salvar como "Rascunho" NÃO cria agendamento de retorno
- [x] Falha no agendamento NÃO bloqueia a gravação do prontuário
- [x] O agendamento criado aparece na agenda da clínica

## 3. Contrato de Dados (API)

```
Método: POST
Endpoint: /schedules
Auth: Sim (roles: DENTISTA, ADMIN)

Payload:
{
  patientId: string,
  professionalId: string,
  startAt: "2026-05-15T08:00:00.000Z",
  endAt: "2026-05-15T09:00:00.000Z",
  notes: "Retorno - Ref: [nomes dos procedimentos]"
}
```

## 4. Regras de Negócio

- RN-01: Horário padrão do retorno é 08h00–09h00 (confirmação posterior com paciente)
- RN-02: Somente "Finalizar Atendimento" dispara o agendamento (não rascunho)
- RN-03: `notes` = `"Retorno - Ref: ${procNames}"` ou `"Retorno agendado via Prontuário"` se sem procedimentos

## 5. Componentes Afetados

**Modificados:**
- `apps/web/src/components/pacientes/prontuario/novo-atendimento/NovoAtendimentoForm.tsx`

## 6. Decisão de Design

- Inline Expansion (formulário já existente — campo `nextReturn` já presente)
- Nenhuma mudança visual necessária

## 7. Verificação (Definition of Done)

- [x] Build sem erros TypeScript
- [x] Agendamento criado na agenda após finalizar atendimento com data de retorno
- [x] notes contém referência ao procedimento
- [x] Prontuário salvo mesmo se agendamento falhar
- [x] Código commitado e deploy realizado
