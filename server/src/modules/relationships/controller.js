/**
 * CargoTrace Event Relationship Controller
 */
import {
  createRelationship,
  updateRelationship,
  getShipmentRelationships,
  getRecordRelationships,
  deleteRelationship,
  searchCandidateRecords,
  getInvestigationGraph
} from './service.js';

export const relationshipController = {
  async create(req, res, next) {
    try {
      const relationship = await createRelationship({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId,
        sourceType: req.body.sourceType,
        sourceId: req.body.sourceId,
        targetType: req.body.targetType,
        targetId: req.body.targetId,
        relationshipType: req.body.relationshipType,
        explanation: req.body.explanation,
        actingUser: req.user,
        req
      });

      res.status(201).json({
        message: 'Event relationship successfully created.',
        relationship
      });
    } catch (err) {
      next(err);
    }
  },

  async listByShipment(req, res, next) {
    try {
      const result = await getShipmentRelationships({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async listByRecord(req, res, next) {
    try {
      const result = await getRecordRelationships({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId,
        recordType: req.params.recordType,
        recordId: req.params.recordId
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const relationship = await updateRelationship({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId,
        relationshipId: req.params.relationshipId,
        data: req.body,
        actingUser: req.user,
        req
      });
      res.json({
        message: 'Event relationship successfully updated.',
        relationship
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await deleteRelationship({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId,
        relationshipId: req.params.relationshipId,
        actingUser: req.user,
        req
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async searchCandidates(req, res, next) {
    try {
      const result = await searchCandidateRecords({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId,
        targetType: req.query.targetType,
        query: req.query.query
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getGraph(req, res, next) {
    try {
      const result = await getInvestigationGraph({
        organizationId: req.organization.id,
        shipmentId: req.params.shipmentId
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
