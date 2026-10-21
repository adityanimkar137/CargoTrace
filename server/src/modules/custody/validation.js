/**
 * CargoTrace Custody Event Request Validation Schemas
 */
import { z } from 'zod';
import { CUSTODY_EVENT_TYPES, CONFIRMATION_STATUSES } from './model.js';

export const createCustodyEventSchema = z.object({
  eventType: z.enum(CUSTODY_EVENT_TYPES, {
    errorMap: () => ({ message: `Event type must be one of: ${CUSTODY_EVENT_TYPES.join(', ')}` })
  }),
  fromParty: z.string().trim().optional().nullable(),
  toParty: z.string().trim().optional().nullable(),
  location: z.string({ required_error: 'Event location is required' }).min(2).max(200).trim(),
  occurredAt: z
    .string({ required_error: 'Event occurrence date/time is required' })
    .transform((val) => new Date(val)),
  notes: z.string().max(1000).trim().optional().nullable(),
  evidenceIds: z.array(z.string()).optional().default([])
});

export const acknowledgeCustodySchema = z.object({
  confirmationStatus: z.enum(CONFIRMATION_STATUSES),
  acknowledgementNotes: z.string().max(1000).trim().optional().nullable()
});
