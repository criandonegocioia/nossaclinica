import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres passados'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
  refreshToken: z.string().min(1, 'O refresh token é obrigatório'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
