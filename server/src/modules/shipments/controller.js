/**
 * CargoTrace Shipment Controller
 * HTTP request handlers for shipment management.
 */
import {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipment
} from './service.js';

export const shipmentController = {
  async create(req, res, next) {
    try {
      const shipment = await createShipment({
        data: req.body,
        organizationId: req.organization.id,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'Shipment registered successfully.',
        shipment
      });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const result = await getShipments({
        organizationId: req.organization.id,
        query: req.query
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const shipment = await getShipmentById({
        shipmentId: req.params.id,
        organizationId: req.organization.id
      });

      res.json({ shipment });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const shipment = await updateShipment({
        shipmentId: req.params.id,
        organizationId: req.organization.id,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.json({
        message: 'Shipment updated successfully.',
        shipment
      });
    } catch (err) {
      next(err);
    }
  }
};
