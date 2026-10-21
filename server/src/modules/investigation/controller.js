/**
 * CargoTrace Investigation Controller
 */
import {
  buildUnifiedTimeline,
  evaluateAnomalies,
  analyzeEvidenceGaps,
  recordReviewDecision,
  generateAICaseReport,
  getAIReports,
  getAIReportById,
  certifyAIReport
} from './service.js';

export const investigationController = {
  async getTimeline(req, res, next) {
    try {
      const result = await buildUnifiedTimeline({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getAnomalies(req, res, next) {
    try {
      const result = await evaluateAnomalies({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getGaps(req, res, next) {
    try {
      const result = await analyzeEvidenceGaps({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async saveReview(req, res, next) {
    try {
      const review = await recordReviewDecision({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        findingId: req.body.findingId,
        findingType: req.body.findingType || 'ANOMALY',
        status: req.body.status,
        reviewNotes: req.body.reviewNotes,
        userId: req.user.id,
        req
      });

      res.json({
        message: 'Investigation review decision recorded.',
        review
      });
    } catch (err) {
      next(err);
    }
  },

  async generateAIReport(req, res, next) {
    try {
      const report = await generateAICaseReport({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'AI Investigation Report generated successfully.',
        report
      });
    } catch (err) {
      next(err);
    }
  },

  async getAIReports(req, res, next) {
    try {
      const result = await getAIReports({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getAIReportById(req, res, next) {
    try {
      const report = await getAIReportById({
        shipmentId: req.params.shipmentId,
        reportId: req.params.reportId,
        organizationId: req.organization.id
      });

      res.json(report);
    } catch (err) {
      next(err);
    }
  },

  async certifyAIReport(req, res, next) {
    try {
      const report = await certifyAIReport({
        shipmentId: req.params.shipmentId,
        reportId: req.params.reportId,
        organizationId: req.organization.id,
        decision: req.body.decision,
        comments: req.body.comments,
        actingUser: req.user,
        req
      });

      res.json({
        message: 'Investigation report certified successfully.',
        report
      });
    } catch (err) {
      next(err);
    }
  }
};
