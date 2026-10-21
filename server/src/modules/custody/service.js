/**
 * CargoTrace Custody Service
 * Handles creation, chronological querying, and confirmation of custody events.
 */
import { CustodyEvent } from './model.js';
import { Shipment } from '../shipments/model.js';
import { AIInvestigationReport } from '../investigation/model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validateRelatedReferences } from '../../utils/referenceValidation.js';

export async function createCustodyEvent({ shipmentId, organizationId, data, userId, req }) {
  // Verify shipment ownership in this organization
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
    throw new AppError('This shipment has a certified and sealed investigation report. No new custody events can be recorded.', 409, 'SHIPMENT_REPORT_SEALED');
  }

  await validateRelatedReferences({
    organizationId,
    shipmentId: shipment._id,
    evidenceIds: data.evidenceIds
  });

  const custodyEvent = await CustodyEvent.create({
    shipment: shipment._id,
    organization: organizationId,
    eventType: data.eventType,
    fromParty: data.fromParty || null,
    toParty: data.toParty || null,
    location: data.location,
    occurredAt: data.occurredAt,
    recordedAt: new Date(),
    recordedBy: userId,
    notes: data.notes || null,
    evidence: data.evidenceIds || []
  });

  await recordAudit({
    action: 'CUSTODY_EVENT_CREATED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      shipmentReference: shipment.shipmentReference,
      custodyEventId: custodyEvent._id.toString(),
      eventType: custodyEvent.eventType,
      location: custodyEvent.location
    },
    req
  });

  return custodyEvent.populate([
    { path: 'recordedBy', select: 'displayName email' },
    { path: 'evidence' }
  ]);
}

export async function getCustodyEventsByShipment({ shipmentId, organizationId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const events = await CustodyEvent.find({
    shipment: shipment._id,
    organization: organizationId
  })
    .populate('recordedBy', 'displayName email')
    .populate('evidence')
    .sort({ occurredAt: 1, createdAt: 1 });

  return events;
}

export async function getCustodyEventById({ custodyEventId, organizationId }) {
  const event = await CustodyEvent.findOne({
    _id: custodyEventId,
    organization: organizationId
  })
    .populate('shipment', 'shipmentReference description')
    .populate('recordedBy', 'displayName email')
    .populate('evidence');

  if (!event) {
    throw new AppError('Custody event record not found or inaccessible.', 404, 'CUSTODY_EVENT_NOT_FOUND');
  }

  return event;
}

export async function acknowledgeCustodyEvent({ custodyEventId, organizationId, confirmationStatus, notes, userId, req }) {
  const event = await CustodyEvent.findOne({ _id: custodyEventId, organization: organizationId });
  if (!event) {
    throw new AppError('Custody event record not found or inaccessible.', 404, 'CUSTODY_EVENT_NOT_FOUND');
  }

  event.confirmationStatus = confirmationStatus;
  event.acknowledgedByToParty = true;
  if (notes) event.acknowledgementNotes = notes;

  await event.save();

  await recordAudit({
    action: 'CUSTODY_EVENT_ACKNOWLEDGED',
    userId,
    organizationId,
    details: {
      custodyEventId: event._id.toString(),
      confirmationStatus,
      acknowledgedByToParty: true
    },
    req
  });

  return event.populate([
    { path: 'recordedBy', select: 'displayName email' },
    { path: 'evidence' }
  ]);
}
