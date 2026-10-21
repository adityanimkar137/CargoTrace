/**
 * CargoTrace Custody Controller
 */
import {
  createCustodyEvent,
  getCustodyEventsByShipment,
  getCustodyEventById,
  acknowledgeCustodyEvent
} from './service.js';

export const custodyController = {
  async create(req, res, next) {
    try {
      const custodyEvent = await createCustodyEvent({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'Custody transition recorded successfully.',
        custodyEvent
      });
    } catch (err) {
      next(err);
    }
  },

  async listByShipment(req, res, next) {
    try {
      const custodyEvents = await getCustodyEventsByShipment({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });

      res.json({ custodyEvents });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const custodyEvent = await getCustodyEventById({
        custodyEventId: req.params.id,
        organizationId: req.organization.id
      });

      res.json({ custodyEvent });
    } catch (err) {
      next(err);
    }
  },

  async acknowledge(req, res, next) {
    try {
      const custodyEvent = await acknowledgeCustodyEvent({
        custodyEventId: req.params.id,
        organizationId: req.organization.id,
        confirmationStatus: req.body.confirmationStatus,
        notes: req.body.acknowledgementNotes,
        userId: req.user.id,
        req
      });

      res.json({
        message: 'Custody acknowledgement updated.',
        custodyEvent
      });
    } catch (err) {
      next(err);
    }
  }
};
