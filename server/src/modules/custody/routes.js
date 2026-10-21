/**
 * CargoTrace Custody Routes
 */
import { Router } from 'express';
import { custodyController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { createCustodyEventSchema, acknowledgeCustodySchema } from './validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Shipment-scoped custody event routes
router.post(
  '/',
  requirePermission(PERMISSIONS.CUSTODY_MANAGE),
  validate({ body: createCustodyEventSchema }),
  custodyController.create
);

router.get(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  custodyController.listByShipment
);

export default router;
