import { z } from 'zod';

export const RoleSchema = z.enum(['customer', 'admin', 'superadmin']);
export type Role = z.infer<typeof RoleSchema>;

export const UserStatusSchema = z.enum(['active', 'suspended', 'pending']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120),
  doc: z.string().regex(/^[\d.\-/]+$/).max(20).nullable(),
  role: RoleSchema,
  status: UserStatusSchema,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  doc: z.string().regex(/^[\d.\-/]+$/).max(20).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
