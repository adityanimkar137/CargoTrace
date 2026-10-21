/**
 * CargoTrace Event Relationship Routes
 */
import { Router } from 'express';
import { relationshipController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../auth/permissions.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Create relationship link
router.post(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  relationshipController.create
);

// List all relationships for shipment
router.get(
  '/',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  relationshipController.listByShipment
);

// Candidate record search for linking UI
router.get(
  '/candidates',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  relationshipController.searchCandidates
);

// Connected relationship graph representation
router.get(
  '/graph',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  relationshipController.getGraph
);

// List relationships for specific record
router.get(
  '/record/:recordType/:recordId',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  relationshipController.listByRecord
);

// Update / correct relationship link
router.patch(
  '/:relationshipId',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  relationshipController.update
);

// Delete relationship link
router.delete(
  '/:relationshipId',
  requirePermission(PERMISSIONS.SHIPMENT_UPDATE),
  relationshipController.delete
);

export default router;
