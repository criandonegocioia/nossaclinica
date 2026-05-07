'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMedicalRecord, useUpdateMedicalRecord, useProcedures, useCreateSchedule } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { InlineFormHeader, Field } from '../../shared/ui';
import { medicalRecordSchema, type MedicalRecordFormValues } from './types';
import { ProcedimentosMultiSelect } from './ProcedimentosMultiSelect';
import { PrescricaoEditor } from './PrescricaoEditor';
import type { MedicalRecord } from '../../shared/types';

interface NovoAtendimentoFormProps {
  patientId: string;
  onDone: () => void;
  editingRecord?: MedicalRecord;
}

export function NovoAtendimentoForm({ patientId, onDone, editingRecord }: NovoAtendimentoFormProps) {
  const create = useCreateMedicalRecord();
  const update = useUpdateMedicalRecord();
  const scheduleCreate = useCreateSchedule();
  const { user } = useAuthStore();
  const { data: procedures = [] } = useProcedures({ active: true });

  // Parse type from complaint "[Type] complaint text" pattern
  const parseType = (complaint?: string) => {
    if (!complaint) return '';
    const match = complaint.match(/^\[(.+?)\]\s*/);
    return match ? match[1] : '';
  };
  const parseComplaint = (complaint?: string) => {
    if (!complaint) return '';
    return complaint.replace(/^\[.+?\]\s*/, '');
  };

  // Map stored procedure names back to IDs for MultiSelect
  const parseProcedureIds = (procString?: string): string[] => {
    if (!procString || procedures.length === 0) return [];
    const names = procString.split(',').map(s => s.trim());
    return names.map(name => procedures.find(p => p.name === name)?.id || name).filter(Boolean);
  };

  const { control, register, handleSubmit, formState: { errors } } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: editingRecord ? {
      type: parseType(editingRecord.complaint),
      dateTime: editingRecord.dateTime
        ? new Date(editingRecord.dateTime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      procedures: parseProcedureIds(editingRecord.procedures),
      complaint: parseComplaint(editingRecord.complaint),
      diagnosis: editingRecord.diagnosis || '',
      treatment: editingRecord.treatmentPlan || '',
      prescription: editingRecord.prescriptions || '',
      notes: editingRecord.orientations || '',
      nextReturn: '',
    } : {
      type: '',
      dateTime: new Date().toISOString().slice(0, 16),
      procedures: [],
      complaint: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: '',
      nextReturn: '',
    }
  });

  const onSubmit = async (data: MedicalRecordFormValues, isDraft: boolean) => {
    const procNames = data.procedures
      .map(id => procedures.find(p => p.id === id)?.name || id)
      .join(', ');

    const payload = {
      patientId,
      dateTime: new Date(data.dateTime).toISOString(),
      procedures: procNames,
      complaint: `[${data.type}] ${data.complaint || ''}`.trim(),
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatment,
      prescriptions: data.prescription,
      orientations: data.notes,
      isDraft,
    };

    if (editingRecord) {
      await update.mutateAsync({ id: editingRecord.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }

    if (data.nextReturn && user?.id && !isDraft) {
      try {
        await scheduleCreate.mutateAsync({
          patientId,
          professionalId: user.id,
          startAt: new Date(data.nextReturn + 'T08:00:00').toISOString(),
          endAt: new Date(data.nextReturn + 'T09:00:00').toISOString(),
          notes: procNames ? `Retorno - Ref: ${procNames}` : 'Retorno agendado via Prontuário',
        });
      } catch (err) {
        console.error('Erro ao agendar retorno automático', err);
        // Não bloqueia a finalização se o agendamento falhar
      }
    }

    onDone();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader
          title={editingRecord ? 'Editar Registro de Atendimento' : 'Novo Registro de Atendimento'}
          onBack={onDone}
        />

        <form>
          <div className="grid grid-2">
            <Field label="Tipo de atendimento *" error={errors.type?.message}>
              <select className="input" {...register('type')}>
                <option value="">Selecione...</option>
                <option value="Consulta de Avaliação">Consulta de Avaliação</option>
                <option value="Tratamento">Tratamento</option>
                <option value="Retorno">Retorno</option>
                <option value="Urgência">Urgência</option>
                <option value="Harmonização Orofacial">Harmonização Orofacial</option>
                <option value="Cirurgia">Cirurgia</option>
              </select>
            </Field>

            <Field label="Data e hora" error={errors.dateTime?.message}>
              <input className="input" type="datetime-local" {...register('dateTime')} />
            </Field>

            <Field label="Procedimento(s)" error={errors.procedures?.message}>
              <Controller
                name="procedures"
                control={control}
                render={({ field }) => (
                  <ProcedimentosMultiSelect value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>

            <Field label="Queixa principal" span error={errors.complaint?.message}>
              <textarea className="input" rows={2} style={{ resize: 'vertical' }} {...register('complaint')} />
            </Field>

            <Field label="Diagnóstico" span error={errors.diagnosis?.message}>
              <textarea className="input" rows={2} style={{ resize: 'vertical' }} {...register('diagnosis')} />
            </Field>

            <Field label="Tratamento / Evolução" span error={errors.treatment?.message}>
              <textarea className="input" rows={3} style={{ resize: 'vertical' }} {...register('treatment')} />
            </Field>

            <Field label="Prescrição / Receita" span error={errors.prescription?.message}>
              <Controller
                name="prescription"
                control={control}
                render={({ field }) => (
                  <PrescricaoEditor value={field.value || ''} onChange={field.onChange} />
                )}
              />
            </Field>

            <Field label="Observações internas" span error={errors.notes?.message}>
              <textarea className="input" rows={2} style={{ resize: 'vertical' }} {...register('notes')} />
            </Field>

            <Field label="Data de retorno" error={errors.nextReturn?.message}>
              <input className="input" type="date" {...register('nextReturn')} />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
            <button type="button" className="btn btn-secondary" onClick={onDone}>Cancelar</button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isPending}
            >
              Salvar Rascunho
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isPending}
            >
              {isPending
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
                : 'Finalizar Atendimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
