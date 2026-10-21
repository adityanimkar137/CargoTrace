/**
 * CargoTrace Shipment Routes
 * Express router enforcing authentication, RBAC permissions, and Zod validation.
 */
import { Router } from 'express';
import { shipmentController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  createShipmentSchema,
  updateShipmentSchema,
  listShipmentQuerySchema
} from './validation.js';

const router = Router();

// All shipment routes require authenticated session with verified organization membership
router.use(authenticate);

// Create shipment (admin, investigator)
router.post(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_CREATE),
  validate({ body: createShipmentSchema }),
  shipmentController.create
);

// List/search shipments (admin, investigator, reviewer, viewer)
router.get(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  validate({ query: listShipmentQuerySchema }),
  shipmentController.list
);

// Get shipment details by ID (admin, investigator, reviewer, viewer)
router.get(
  '/:id',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  shipmentController.getById
);

// Update shipment (admin, investigator)
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  validate({ body: updateShipmentSchema }),
  shipmentController.update
);

export default router;
