import { z } from 'zod';

export const medicalRecordSchema = z.object({
  dateTime: z.string().min(1, 'Data e hora são obrigatórios'),
  procedures: z.array(z.string()).min(1, 'Selecione ao menos um procedimento'),
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  nextReturn: z.string().optional().refine(val => {
    if (!val) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(val + 'T00:00:00');
    return selectedDate > today;
  }, 'Data de retorno inválida. Deve ser maior que a data atual.'),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;
