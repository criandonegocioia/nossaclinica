'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMedicalRecord, useProcedures, useCreateSchedule } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { InlineFormHeader, Field } from '../../shared/ui';
import { medicalRecordSchema, type MedicalRecordFormValues } from './types';
import { ProcedimentosMultiSelect } from './ProcedimentosMultiSelect';
import { PrescricaoEditor } from './PrescricaoEditor';

export function NovoAtendimentoForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const create = useCreateMedicalRecord();
  const scheduleCreate = useCreateSchedule();
  const { user } = useAuthStore();
  const { data: procedures = [] } = useProcedures({ active: true });

  const { control, register, handleSubmit, formState: { errors } } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
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

    await create.mutateAsync({
      patientId,
      dateTime: new Date(data.dateTime).toISOString(),
      procedures: procNames,
      complaint: data.complaint,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatment,
      prescriptions: data.prescription,
      orientations: data.notes,
      isDraft
    });

    if (data.nextReturn && user?.id && !isDraft) {
      await scheduleCreate.mutateAsync({
        patientId,
        professionalId: user.id,
        startAt: new Date(data.nextReturn + 'T08:00:00').toISOString(),
        endAt: new Date(data.nextReturn + 'T09:00:00').toISOString(),
        notes: 'Retorno agendado via Prontuário',
      });
    }

    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Atendimento" onBack={onDone} />
        
        <form>
          <div className="grid grid-2">
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
              disabled={create.isPending}
            >
              Salvar Rascunho
            </button>
            
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit((data) => onSubmit(data, false))} 
              disabled={create.isPending}
            >
              {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : 'Finalizar Atendimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
