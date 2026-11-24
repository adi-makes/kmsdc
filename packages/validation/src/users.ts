import { z } from 'zod';
import { ROLE_KEYS } from '@kmsdc/types';

export const createUserSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(8).max(128).optional(),
  roles: z.array(z.enum(ROLE_KEYS as unknown as [string, ...string[]])).min(1),
  branchId: z.uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  mustChangePassword: z.boolean().optional(),
  roles: z.array(z.enum(ROLE_KEYS as unknown as [string, ...string[]])).optional(),
  branchId: z.uuid().nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
