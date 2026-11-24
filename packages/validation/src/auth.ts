import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email(),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8).max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
