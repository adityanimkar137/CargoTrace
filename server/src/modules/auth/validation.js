/**
 * CargoTrace Authentication Validation Schemas
 */
import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long'),
  displayName: z
    .string({ required_error: 'Display name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer')
    .trim(),
  organizationName: z
    .string({ required_error: 'Organization name is required' })
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be 100 characters or fewer')
    .trim()
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});
