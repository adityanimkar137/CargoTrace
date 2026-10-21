/**
 * CargoTrace Inspection Routes
 */
import { Router } from 'express';
import { inspectionController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { createInspectionSchema } from './validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Shipment-scoped inspection routes
router.post(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  validate({ body: createInspectionSchema }),
  inspectionController.create
);

router.get(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  inspectionController.listByShipment
);

export default router;
