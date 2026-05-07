# ADR-004: Agendamento Automático de Retorno via Prontuário
**Status**: ACCEPTED  
**Data**: 2026-05-07  
**Contexto**: Módulo de Prontuário — NovoAtendimentoForm

---

## Contexto

O profissional precisa agendar o retorno do paciente ao finalizar um atendimento.
O fluxo anterior exigia que a secretária criasse o agendamento manualmente na agenda
após o dentista informar verbalmente a data de retorno.

## Decisão

Ao preencher o campo **"Data de retorno"** no `NovoAtendimentoForm` e clicar em
**"Finalizar Atendimento"**, o sistema automaticamente cria um agendamento na agenda
referenciando o(s) procedimento(s) realizados.

### Implementação

**Arquivo**: `apps/web/src/components/pacientes/prontuario/novo-atendimento/NovoAtendimentoForm.tsx`

**Fluxo**:
```
1. Profissional finaliza atendimento (não rascunho)
2. Sistema salva MedicalRecord via useCreateMedicalRecord
3. Se nextReturn preenchido → dispara useCreateSchedule com:
   - patientId
   - professionalId (usuário logado)
   - startAt: [data] + T08:00:00
   - endAt: [data] + T09:00:00
   - notes: "Retorno - Ref: [nomes dos procedimentos]"
4. Erro de agendamento é capturado silenciosamente (não bloqueia)
```

### Payload de Agendamento

```typescript
{
  patientId: string,
  professionalId: string,        // user.id do auth store
  startAt: "2026-05-15T08:00:00.000Z",
  endAt: "2026-05-15T09:00:00.000Z",
  notes: "Retorno - Ref: Limpeza e Profilaxia, Aplicação de Flúor"
}
```

## Regras de Negócio

- **Somente em "Finalizar Atendimento"**: Rascunhos não criam agendamento
- **Horário padrão**: 08h00–09h00 (horário a confirmar com paciente)
- **Referência ao procedimento**: Concatenado nos `notes` do agendamento
- **Falha silenciosa**: Erro no agendamento não impede salvar o prontuário

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| Campo `type: RETORNO` no Schedule | Schema não possui campo type |
| Transação atômica (rollback se agendamento falhar) | Prontuário é mais crítico que agendamento |
| Popup de confirmação antes de agendar | Fricção desnecessária no fluxo clínico |

## Consequências

- ✅ Zero esforço manual da secretária para retornos agendados pelo dentista
- ✅ Rastreabilidade: retorno ligado ao procedimento nos notes
- ✅ Prontuário nunca perdido por falha de agendamento (try/catch isolado)
- ⚠️ Horário fixo (08h) pode precisar de ajuste manual posterior na agenda

## Schema Relacionado

```prisma
model Schedule {
  patientId       String?
  professionalId  String
  startAt         DateTime
  endAt           DateTime
  notes           String?   ← "Retorno - Ref: [procedimento]"
  status          ScheduleStatus @default(AGENDADO)
}
```
