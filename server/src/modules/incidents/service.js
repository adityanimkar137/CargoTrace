/**
 * CargoTrace Damage Incident Service
 */
import { DamageIncident } from './model.js';
import { Shipment } from '../shipments/model.js';
import { AIInvestigationReport } from '../investigation/model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validateRelatedReferences } from '../../utils/referenceValidation.js';

export async function createIncident({ shipmentId, organizationId, data, userId, req }) {
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
    throw new AppError('This shipment has a certified and sealed investigation report. No new incidents can be attached.', 409, 'SHIPMENT_REPORT_SEALED');
  }

  await validateRelatedReferences({
    organizationId,
    shipmentId: shipment._id,
    evidenceIds: data.evidenceIds,
    relatedInspections: data.relatedInspections,
    relatedCustodyEvents: data.relatedCustodyEvents
  });

  let incidentReference = DamageIncident.generateReference();
  let attempts = 0;
  while (attempts < 3) {
    const existing = await DamageIncident.findOne({ incidentReference });
    if (!existing) break;
    incidentReference = DamageIncident.generateReference();
    attempts++;
  }

  const incident = await DamageIncident.create({
    incidentReference,
    shipment: shipment._id,
    organization: organizationId,
    title: data.title,
    description: data.description,
    damageType: data.damageType,
    severity: data.severity || 'UNKNOWN',
    location: data.location,
    occurredAt: data.occurredAt || null,
    discoveredAt: data.discoveredAt,
    reportedAt: new Date(),
    reportedBy: userId,
    affectedCargo: data.affectedCargo || null,
    status: data.status || 'OPEN',
    relatedInspections: data.relatedInspections || [],
    relatedCustodyEvents: data.relatedCustodyEvents || [],
    evidence: data.evidenceIds || []
  });

  await recordAudit({
    action: 'DAMAGE_INCIDENT_CREATED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      incidentId: incident._id.toString(),
      incidentReference: incident.incidentReference,
      damageType: incident.damageType,
      severity: incident.severity
    },
    req
  });

  return incident.populate([
    { path: 'reportedBy', select: 'displayName email' },
    { path: 'evidence' },
    { path: 'relatedInspections' },
    { path: 'relatedCustodyEvents' }
  ]);
}

export async function getIncidentsByShipment({ shipmentId, organizationId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const incidents = await DamageIncident.find({
    shipment: shipment._id,
    organization: organizationId
  })
    .populate('reportedBy', 'displayName email')
    .populate('resolvedBy', 'displayName email')
    .populate('evidence')
    .populate('relatedInspections')
    .populate('relatedCustodyEvents')
    .sort({ reportedAt: -1 });

  return incidents;
}

export async function getIncidentById({ incidentId, organizationId }) {
  const incident = await DamageIncident.findOne({
    _id: incidentId,
    organization: organizationId
  })
    .populate('shipment', 'shipmentReference description')
    .populate('reportedBy', 'displayName email')
    .populate('resolvedBy', 'displayName email')
    .populate('evidence')
    .populate('relatedInspections')
    .populate('relatedCustodyEvents');

  if (!incident) {
    throw new AppError('Damage incident record not found or inaccessible.', 404, 'INCIDENT_NOT_FOUND');
  }

  return incident;
}

export async function updateIncident({ incidentId, organizationId, data, userId, req }) {
  const incident = await DamageIncident.findOne({
    _id: incidentId,
    organization: organizationId
  });

  if (!incident) {
    throw new AppError('Damage incident record not found or inaccessible.', 404, 'INCIDENT_NOT_FOUND');
  }

  const previousStatus = incident.status;

  if (data.title !== undefined) incident.title = data.title;
  if (data.description !== undefined) incident.description = data.description;
  if (data.damageType !== undefined) incident.damageType = data.damageType;
  if (data.severity !== undefined) incident.severity = data.severity;
  if (data.location !== undefined) incident.location = data.location;
  if (data.affectedCargo !== undefined) incident.affectedCargo = data.affectedCargo;

  if (data.status !== undefined) {
    incident.status = data.status;
    if (data.status === 'RESOLVED' && previousStatus !== 'RESOLVED') {
      incident.resolvedBy = userId;
      incident.resolvedAt = new Date();
    }
  }

  if (data.resolutionNotes !== undefined) {
    incident.resolutionNotes = data.resolutionNotes;
  }

  await incident.save();

  await recordAudit({
    action: 'DAMAGE_INCIDENT_UPDATED',
    userId,
    organizationId,
    details: {
      incidentId: incident._id.toString(),
      incidentReference: incident.incidentReference,
      previousStatus,
      newStatus: incident.status
    },
    req
  });

  return incident.populate([
    { path: 'reportedBy', select: 'displayName email' },
    { path: 'resolvedBy', select: 'displayName email' },
    { path: 'evidence' }
  ]);
}
