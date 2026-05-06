import { z } from 'zod';

export const medicalRecordSchema = z.object({
  dateTime: z.string().min(1, 'Data e hora são obrigatórios'),
  procedures: z.array(z.string()).min(1, 'Selecione ao menos um procedimento'),
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  nextReturn: z.string().optional(),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;
