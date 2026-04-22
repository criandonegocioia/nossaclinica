import { z } from 'zod';

export const CreatePhotoSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  procedureId: z.string().uuid().optional(),
  driveLink: z.string().url().optional(),
});

export type CreatePhotoDto = z.infer<typeof CreatePhotoSchema>;

export const QuarantinePhotoSchema = z.object({
  id: z.string().uuid('ID de foto inválido'),
});

export type QuarantinePhotoDto = z.infer<typeof QuarantinePhotoSchema>;
