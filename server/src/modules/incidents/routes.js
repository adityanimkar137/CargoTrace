/**
 * CargoTrace Damage Incident Routes
 */
import { Router } from 'express';
import { incidentController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { createIncidentSchema, updateIncidentSchema } from './validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Shipment-scoped incident routes
router.post(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  validate({ body: createIncidentSchema }),
  incidentController.create
);

router.get(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  incidentController.listByShipment
);

export default router;
