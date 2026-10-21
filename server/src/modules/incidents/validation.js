/**
 * CargoTrace Damage Incident Request Validation Schemas
 */
import { z } from 'zod';
import { DAMAGE_TYPES, SEVERITY_LEVELS, INCIDENT_STATUSES } from './model.js';

export const createIncidentSchema = z.object({
  title: z.string({ required_error: 'Incident title is required' }).min(3).max(200).trim(),
  description: z.string({ required_error: 'Damage description is required' }).min(5).trim(),
  damageType: z.enum(DAMAGE_TYPES),
  severity: z.enum(SEVERITY_LEVELS).default('UNKNOWN'),
  location: z.string({ required_error: 'Location is required' }).min(2).max(200).trim(),
  occurredAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? new Date(val) : null)),
  discoveredAt: z
    .string({ required_error: 'Discovery date/time is required' })
    .transform((val) => new Date(val)),
  affectedCargo: z.string().max(500).trim().optional().nullable(),
  status: z.enum(INCIDENT_STATUSES).default('OPEN'),
  relatedInspections: z.array(z.string()).optional().default([]),
  relatedCustodyEvents: z.array(z.string()).optional().default([]),
  evidenceIds: z.array(z.string()).optional().default([])
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().min(5).trim().optional(),
  damageType: z.enum(DAMAGE_TYPES).optional(),
  severity: z.enum(SEVERITY_LEVELS).optional(),
  location: z.string().min(2).max(200).trim().optional(),
  affectedCargo: z.string().max(500).trim().optional().nullable(),
  status: z.enum(INCIDENT_STATUSES).optional(),
  resolutionNotes: z.string().max(2000).trim().optional().nullable()
});
