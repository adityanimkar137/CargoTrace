/**
 * CargoTrace Organization & Membership Validation Schemas
 */
import { z } from 'zod';
import { VALID_ROLES } from '../memberships/model.js';

export const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'Member email address is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer')
    .trim()
    .optional(),
  role: z
    .enum(VALID_ROLES, {
      errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
    })
    .default('viewer'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be 100 characters or fewer')
});

export const resetMemberPasswordSchema = z.object({
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be 100 characters or fewer')
});

