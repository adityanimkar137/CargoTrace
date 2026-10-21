/**
 * CargoTrace Evidence Routes
 */
import { Router } from 'express';
import { evidenceController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { evidenceUpload } from './uploadMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Shipment-scoped evidence routes
router.post(
  '/',
  requirePermission(PERMISSIONS.EVIDENCE_UPLOAD),
  evidenceUpload.single('file'),
  evidenceController.upload
);

router.get(
  '/',
  requirePermission(PERMISSIONS.EVIDENCE_READ),
  evidenceController.listByShipment
);

router.get(
  '/:id/file',
  requirePermission(PERMISSIONS.EVIDENCE_READ),
  evidenceController.streamFile
);

export default router;
