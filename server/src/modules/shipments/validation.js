/**
 * CargoTrace Shipment Request Validation Schemas
 */
import { z } from 'zod';
import { SHIPMENT_STATUSES } from './model.js';

export const createShipmentSchema = z.object({
  description: z
    .string({ required_error: 'Shipment description is required' })
    .min(2, 'Description must be at least 2 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  origin: z
    .string({ required_error: 'Origin location is required' })
    .min(2, 'Origin location must be at least 2 characters')
    .max(200, 'Origin location cannot exceed 200 characters')
    .trim(),
  destination: z
    .string({ required_error: 'Destination location is required' })
    .min(2, 'Destination location must be at least 2 characters')
    .max(200, 'Destination location cannot exceed 200 characters')
    .trim(),
  carrier: z
    .string()
    .max(200, 'Carrier name cannot exceed 200 characters')
    .trim()
    .optional(),
  trackingReference: z
    .string()
    .max(200, 'Tracking reference cannot exceed 200 characters')
    .trim()
    .optional(),
  status: z
    .enum(SHIPMENT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${SHIPMENT_STATUSES.join(', ')}` })
    })
    .default('REGISTERED'),
  expectedArrival: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? new Date(val) : null)),
  notes: z
    .string()
    .max(2000, 'Operational notes cannot exceed 2000 characters')
    .trim()
    .optional()
});

export const updateShipmentSchema = z.object({
  description: z
    .string()
    .min(2, 'Description must be at least 2 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  origin: z
    .string()
    .min(2, 'Origin location must be at least 2 characters')
    .max(200, 'Origin location cannot exceed 200 characters')
    .trim()
    .optional(),
  destination: z
    .string()
    .min(2, 'Destination location must be at least 2 characters')
    .max(200, 'Destination location cannot exceed 200 characters')
    .trim()
    .optional(),
  carrier: z
    .string()
    .max(200, 'Carrier name cannot exceed 200 characters')
    .trim()
    .optional()
    .nullable(),
  trackingReference: z
    .string()
    .max(200, 'Tracking reference cannot exceed 200 characters')
    .trim()
    .optional()
    .nullable(),
  status: z
    .enum(SHIPMENT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${SHIPMENT_STATUSES.join(', ')}` })
    })
    .optional(),
  expectedArrival: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? new Date(val) : null)),
  notes: z
    .string()
    .max(2000, 'Operational notes cannot exceed 2000 characters')
    .trim()
    .optional()
    .nullable()
});

export const listShipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  origin: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'expectedArrival', 'status', 'shipmentReference', 'origin', 'destination']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
