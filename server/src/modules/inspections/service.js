/**
 * CargoTrace Inspection Service
 * Logic for submitting and reading cargo condition inspections.
 */
import { Inspection } from './model.js';
import { Shipment } from '../shipments/model.js';
import { AIInvestigationReport } from '../investigation/model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validateRelatedReferences } from '../../utils/referenceValidation.js';

export async function createInspection({ shipmentId, organizationId, data, userId, req }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const certifiedReport = await AIInvestigationReport.findOne({
    shipment: shipment._id,
    organization: organizationId,
    status: 'CERTIFIED'
  });
  if (certifiedReport) {
    throw new AppError('This shipment has a certified and sealed investigation report. No new condition inspections can be created.', 409, 'SHIPMENT_REPORT_SEALED');
  }

  await validateRelatedReferences({
    organizationId,
    shipmentId: shipment._id,
    evidenceIds: data.evidenceIds
  });

  const inspection = await Inspection.create({
    shipment: shipment._id,
    organization: organizationId,
    inspectionType: data.inspectionType,
    location: data.location,
    inspectedAt: data.inspectedAt,
    recordedAt: new Date(),
    inspectedBy: userId,
    overallCondition: data.overallCondition || 'UNKNOWN',
    packagingCondition: data.packagingCondition || 'UNKNOWN',
    sealCondition: data.sealCondition || 'UNKNOWN',
    visibleDamage: data.visibleDamage || false,
    damageDescription: data.damageDescription || null,
    observations: data.observations || null,
    evidence: data.evidenceIds || []
  });

  await recordAudit({
    action: 'INSPECTION_CREATED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      inspectionId: inspection._id.toString(),
      overallCondition: inspection.overallCondition,
      visibleDamage: inspection.visibleDamage
    },
    req
  });

  return inspection.populate([
    { path: 'inspectedBy', select: 'displayName email' },
    { path: 'evidence' }
  ]);
}

export async function getInspectionsByShipment({ shipmentId, organizationId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const inspections = await Inspection.find({
    shipment: shipment._id,
    organization: organizationId
  })
    .populate('inspectedBy', 'displayName email')
    .populate('evidence')
    .sort({ inspectedAt: -1 });

  return inspections;
}

export async function getInspectionById({ inspectionId, organizationId }) {
  const inspection = await Inspection.findOne({
    _id: inspectionId,
    organization: organizationId
  })
    .populate('shipment', 'shipmentReference description')
    .populate('inspectedBy', 'displayName email')
    .populate('evidence');

  if (!inspection) {
    throw new AppError('Inspection record not found or inaccessible.', 404, 'INSPECTION_NOT_FOUND');
  }

  return inspection;
}
