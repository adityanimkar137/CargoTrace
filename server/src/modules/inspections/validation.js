/**
 * CargoTrace Inspection Request Validation Schemas
 */
import { z } from 'zod';
import { INSPECTION_TYPES, CONDITION_VALUES, SEAL_CONDITIONS } from './model.js';

export const createInspectionSchema = z.object({
  inspectionType: z.enum(INSPECTION_TYPES),
  location: z.string({ required_error: 'Location is required' }).min(2).max(200).trim(),
  inspectedAt: z
    .string({ required_error: 'Inspection time is required' })
    .transform((val) => new Date(val)),
  overallCondition: z.enum(CONDITION_VALUES).default('UNKNOWN'),
  packagingCondition: z.enum(CONDITION_VALUES).default('UNKNOWN'),
  sealCondition: z.enum(SEAL_CONDITIONS).default('UNKNOWN'),
  visibleDamage: z.boolean().default(false),
  damageDescription: z.string().max(1000).trim().optional().nullable(),
  observations: z.string().max(1000).trim().optional().nullable(),
  evidenceIds: z.array(z.string()).optional().default([])
});
