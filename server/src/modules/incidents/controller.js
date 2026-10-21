/**
 * CargoTrace Damage Incident Controller
 */
import {
  createIncident,
  getIncidentsByShipment,
  getIncidentById,
  updateIncident
} from './service.js';

export const incidentController = {
  async create(req, res, next) {
    try {
      const incident = await createIncident({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'Damage incident reported successfully.',
        incident
      });
    } catch (err) {
      next(err);
    }
  },

  async listByShipment(req, res, next) {
    try {
      const incidents = await getIncidentsByShipment({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });

      res.json({ incidents });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const incident = await getIncidentById({
        incidentId: req.params.id,
        organizationId: req.organization.id
      });

      res.json({ incident });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const incident = await updateIncident({
        incidentId: req.params.id,
        organizationId: req.organization.id,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.json({
        message: 'Damage incident updated successfully.',
        incident
      });
    } catch (err) {
      next(err);
    }
  }
};
