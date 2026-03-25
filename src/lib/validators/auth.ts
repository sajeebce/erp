import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  orgSlug: z.string().min(1, 'Organization slug is required'),
})

export const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  orgSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/, 'Slug must be 4-50 chars, lowercase alphanumeric and hyphens'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  orgSlug: z.string().min(1),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
  orgSlug: z.string().min(1),
  newPassword: z.string().min(8),
})
