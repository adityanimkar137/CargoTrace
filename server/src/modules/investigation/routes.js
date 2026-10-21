/**
 * CargoTrace Investigation Routes
 */
import { Router } from 'express';
import { investigationController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../auth/permissions.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/timeline',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  investigationController.getTimeline
);

router.get(
  '/anomalies',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  investigationController.getAnomalies
);

router.get(
  '/gaps',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  investigationController.getGaps
);

router.post(
  '/review',
  requirePermission(PERMISSIONS.INVESTIGATION_RUN),
  investigationController.saveReview
);

router.post(
  '/ai-reports',
  requirePermission(PERMISSIONS.INVESTIGATION_RUN),
  investigationController.generateAIReport
);

router.get(
  '/ai-reports',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  investigationController.getAIReports
);

router.get(
  '/ai-reports/:reportId',
  requirePermission(PERMISSIONS.SHIPMENT_READ),
  investigationController.getAIReportById
);

router.post(
  '/ai-reports/:reportId/certify',
  requirePermission(PERMISSIONS.REPORT_APPROVE),
  investigationController.certifyAIReport
);

export default router;
