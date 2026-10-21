/**
 * CargoTrace Inspection Controller
 */
import {
  createInspection,
  getInspectionsByShipment,
  getInspectionById
} from './service.js';

export const inspectionController = {
  async create(req, res, next) {
    try {
      const inspection = await createInspection({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'Cargo condition inspection submitted successfully.',
        inspection
      });
    } catch (err) {
      next(err);
    }
  },

  async listByShipment(req, res, next) {
    try {
      const inspections = await getInspectionsByShipment({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });

      res.json({ inspections });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const inspection = await getInspectionById({
        inspectionId: req.params.id,
        organizationId: req.organization.id
      });

      res.json({ inspection });
    } catch (err) {
      next(err);
    }
  }
};
