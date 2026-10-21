/**
 * CargoTrace Event Relationship Service
 * Handles validation, persistent creation, bidirectional querying, candidate search, deletion, and graph generation.
 */
import mongoose from 'mongoose';
import { EventRelationship, RELATIONSHIP_DESCRIPTIONS } from './model.js';
import { Shipment } from '../shipments/model.js';
import { CustodyEvent } from '../custody/model.js';
import { Inspection } from '../inspections/model.js';
import { DamageIncident } from '../incidents/model.js';
import { Evidence } from '../evidence/model.js';
import { InvestigationReview, AIInvestigationReport } from '../investigation/model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';

// Allowed relationship matrix mapping (sourceType:targetType -> array of valid relationshipType strings)
export const ALLOWED_RELATIONSHIPS_MAP = {
  'shipment:custody': ['SHIPMENT_HAS_CUSTODY_EVENT'],
  'shipment:inspection': ['SHIPMENT_HAS_INSPECTION'],
  'shipment:incident': ['SHIPMENT_HAS_INCIDENT'],
  'shipment:evidence': ['SHIPMENT_HAS_EVIDENCE'],

  'inspection:incident': ['INSPECTION_DOCUMENTS_INCIDENT'],
  'inspection:evidence': ['INSPECTION_SUPPORTED_BY_EVIDENCE'],
  'inspection:custody': ['INSPECTION_OBSERVED_DURING_CUSTODY'],

  'custody:custody': ['CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT'],
  'custody:incident': ['INCIDENT_OCCURRED_DURING_CUSTODY'],
  'custody:evidence': ['CUSTODY_SUPPORTED_BY_EVIDENCE'],

  'incident:evidence': ['INCIDENT_SUPPORTED_BY_EVIDENCE'],
  'incident:custody': ['INCIDENT_OCCURRED_DURING_CUSTODY'],
  'incident:inspection': ['INSPECTION_DOCUMENTS_INCIDENT'],

  'evidence:evidence': ['EVIDENCE_CORROBORATES_EVIDENCE'],

  'anomaly:shipment': ['ANOMALY_CONCERNS_RECORD'],
  'anomaly:custody': ['ANOMALY_CONCERNS_RECORD'],
  'anomaly:inspection': ['ANOMALY_CONCERNS_RECORD'],
  'anomaly:incident': ['ANOMALY_CONCERNS_RECORD'],
  'anomaly:evidence': ['ANOMALY_CONCERNS_RECORD'],

  'report:shipment': ['REPORT_CITES_RECORD'],
  'report:custody': ['REPORT_CITES_RECORD'],
  'report:inspection': ['REPORT_CITES_RECORD'],
  'report:incident': ['REPORT_CITES_RECORD'],
  'report:evidence': ['REPORT_CITES_RECORD']
};

export function isAllowedRelationship(sourceType, targetType, relationshipType) {
  const key = `${sourceType}:${targetType}`;
  const allowed = ALLOWED_RELATIONSHIPS_MAP[key];
  if (!allowed) return false;
  return allowed.includes(relationshipType);
}

// Helper to verify existence of source or target record in DB
async function findRecordByIdAndType(type, id, organizationId, shipmentId) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  switch (type) {
    case 'shipment': {
      return Shipment.findOne({ _id: id, organization: organizationId });
    }
    case 'custody': {
      return CustodyEvent.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    case 'inspection': {
      return Inspection.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    case 'incident': {
      return DamageIncident.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    case 'evidence': {
      return Evidence.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    case 'review': {
      return InvestigationReview.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    case 'report': {
      return AIInvestigationReport.findOne({ _id: id, organization: organizationId, shipment: shipmentId });
    }
    default:
      return null;
  }
}

// Format record summary label for display
function getRecordSummaryLabel(type, record) {
  if (!record) return `${type.toUpperCase()} [Record]`;
  switch (type) {
    case 'shipment':
      return `Shipment ${record.shipmentReference} (${record.origin} → ${record.destination})`;
    case 'custody':
      return `Handover ${record.eventType}: ${record.fromParty || 'Origin'} → ${record.toParty || 'Dest'} at ${record.location}`;
    case 'inspection':
      return `Inspection (${record.inspectionType}): Condition ${record.overallCondition} at ${record.location}`;
    case 'incident':
      return `Incident [${record.incidentReference}]: ${record.title} (${record.severity})`;
    case 'evidence':
      return `Evidence [${record.evidenceReference}]: ${record.originalFilename} (${record.evidenceType})`;
    case 'review':
      return `Review Note on Finding '${record.findingId}' (${record.status})`;
    case 'report':
      return `AI Report v${record.version} (${record.overallRiskLevel} Risk)`;
    default:
      return `${type.toUpperCase()} Record`;
  }
}

export async function createRelationship({
  organizationId,
  shipmentId,
  sourceType,
  sourceId,
  targetType,
  targetId,
  relationshipType,
  explanation,
  actingUser,
  req
}) {
  // 1. Verify shipment ownership
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  // 2. Reject self-links
  if (sourceType === targetType && sourceId.toString() === targetId.toString()) {
    throw new AppError('Cannot create self-referencing relationship.', 400, 'INVALID_SELF_LINK');
  }

  // 3. Validate relationship matrix
  if (!isAllowedRelationship(sourceType, targetType, relationshipType)) {
    throw new AppError(
      `Invalid relationship type '${relationshipType}' for link between ${sourceType} and ${targetType}.`,
      400,
      'INVALID_RELATIONSHIP_TYPE'
    );
  }

  // 4. Verify source and target records exist and belong to this organization & shipment
  const [sourceRecord, targetRecord] = await Promise.all([
    findRecordByIdAndType(sourceType, sourceId, organizationId, shipment._id),
    findRecordByIdAndType(targetType, targetId, organizationId, shipment._id)
  ]);

  if (!sourceRecord) {
    throw new AppError(`Source ${sourceType} record not found or inaccessible.`, 404, 'SOURCE_RECORD_NOT_FOUND');
  }
  if (!targetRecord) {
    throw new AppError(`Target ${targetType} record not found or inaccessible.`, 404, 'TARGET_RECORD_NOT_FOUND');
  }

  // 5. Create relationship safely
  let relationship = null;
  try {
    relationship = await EventRelationship.create({
      organization: organizationId,
      shipment: shipment._id,
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      explanation: explanation || RELATIONSHIP_DESCRIPTIONS[relationshipType] || '',
      createdBy: actingUser.id,
      updatedBy: actingUser.id
    });
    await relationship.populate('createdBy', 'displayName email');
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('This exact relationship link already exists.', 409, 'DUPLICATE_RELATIONSHIP');
    }
    throw err;
  }

  // Synchronize document model arrays if applicable
  if (sourceType === 'incident' && targetType === 'evidence') {
    await DamageIncident.updateOne({ _id: sourceId, organization: organizationId }, { $addToSet: { evidence: targetId } });
  } else if (sourceType === 'inspection' && targetType === 'evidence') {
    await Inspection.updateOne({ _id: sourceId, organization: organizationId }, { $addToSet: { evidence: targetId } });
  } else if (sourceType === 'inspection' && targetType === 'incident') {
    await DamageIncident.updateOne({ _id: targetId, organization: organizationId }, { $addToSet: { relatedInspections: sourceId } });
  } else if (sourceType === 'custody' && targetType === 'evidence') {
    await CustodyEvent.updateOne({ _id: sourceId, organization: organizationId }, { $addToSet: { evidence: targetId } });
  }

  await recordAudit({
    action: 'EVENT_RELATIONSHIP_CREATED',
    userId: actingUser.id,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      shipmentReference: shipment.shipmentReference,
      relationshipId: relationship._id.toString(),
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      explanation
    },
    req
  });

  return {
    ...relationship.toObject(),
    sourceSummary: getRecordSummaryLabel(sourceType, sourceRecord),
    targetSummary: getRecordSummaryLabel(targetType, targetRecord)
  };
}

export async function updateRelationship({
  organizationId,
  shipmentId,
  relationshipId,
  data,
  actingUser,
  req
}) {
  const existing = await EventRelationship.findOne({
    _id: relationshipId,
    organization: organizationId,
    shipment: shipmentId
  });

  if (!existing) {
    throw new AppError('Relationship record not found or inaccessible.', 404, 'RELATIONSHIP_NOT_FOUND');
  }

  const sourceType = data.sourceType || existing.sourceType;
  const sourceId = data.sourceId || existing.sourceId;
  const targetType = data.targetType || existing.targetType;
  const targetId = data.targetId || existing.targetId;
  const relationshipType = data.relationshipType || existing.relationshipType;
  const explanation = data.explanation !== undefined ? data.explanation : existing.explanation;

  // 1. Reject self-links
  if (sourceType === targetType && sourceId.toString() === targetId.toString()) {
    throw new AppError('Cannot create self-referencing relationship.', 400, 'INVALID_SELF_LINK');
  }

  // 2. Validate relationship matrix
  if (!isAllowedRelationship(sourceType, targetType, relationshipType)) {
    throw new AppError(
      `Invalid relationship type '${relationshipType}' for link between ${sourceType} and ${targetType}.`,
      400,
      'INVALID_RELATIONSHIP_TYPE'
    );
  }

  // 3. Verify records exist
  const [sourceRecord, targetRecord] = await Promise.all([
    findRecordByIdAndType(sourceType, sourceId, organizationId, shipmentId),
    findRecordByIdAndType(targetType, targetId, organizationId, shipmentId)
  ]);

  if (!sourceRecord) {
    throw new AppError(`Source ${sourceType} record not found or inaccessible.`, 404, 'SOURCE_RECORD_NOT_FOUND');
  }
  if (!targetRecord) {
    throw new AppError(`Target ${targetType} record not found or inaccessible.`, 404, 'TARGET_RECORD_NOT_FOUND');
  }

  existing.sourceType = sourceType;
  existing.sourceId = sourceId;
  existing.targetType = targetType;
  existing.targetId = targetId;
  existing.relationshipType = relationshipType;
  existing.explanation = explanation || RELATIONSHIP_DESCRIPTIONS[relationshipType] || '';
  existing.updatedBy = actingUser.id;

  try {
    await existing.save();
    await existing.populate('createdBy', 'displayName email');
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Another identical relationship link already exists.', 409, 'DUPLICATE_RELATIONSHIP');
    }
    throw err;
  }

  await recordAudit({
    action: 'EVENT_RELATIONSHIP_CORRECTED',
    userId: actingUser.id,
    organizationId,
    details: {
      shipmentId,
      relationshipId: existing._id.toString(),
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      explanation
    },
    req
  });

  return {
    ...existing.toObject(),
    sourceSummary: getRecordSummaryLabel(sourceType, sourceRecord),
    targetSummary: getRecordSummaryLabel(targetType, targetRecord)
  };
}

export async function getShipmentRelationships({ organizationId, shipmentId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const relationships = await EventRelationship.find({
    organization: organizationId,
    shipment: shipment._id
  })
    .populate('createdBy', 'displayName email')
    .sort({ createdAt: -1 });

  // Resolve record details for rich bidirectional views
  const enriched = await Promise.all(
    relationships.map(async (rel) => {
      const [sourceRec, targetRec] = await Promise.all([
        findRecordByIdAndType(rel.sourceType, rel.sourceId, organizationId, shipment._id),
        findRecordByIdAndType(rel.targetType, rel.targetId, organizationId, shipment._id)
      ]);

      return {
        ...rel.toObject(),
        sourceSummary: getRecordSummaryLabel(rel.sourceType, sourceRec),
        targetSummary: getRecordSummaryLabel(rel.targetType, targetRec),
        sourceRecord: sourceRec ? { id: sourceRec._id, ...sourceRec.toObject() } : null,
        targetRecord: targetRec ? { id: targetRec._id, ...targetRec.toObject() } : null
      };
    })
  );

  return {
    shipmentId: shipment._id.toString(),
    shipmentReference: shipment.shipmentReference,
    totalRelationships: enriched.length,
    relationships: enriched
  };
}

export async function getRecordRelationships({ organizationId, shipmentId, recordType, recordId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const relationships = await EventRelationship.find({
    organization: organizationId,
    shipment: shipment._id,
    $or: [
      { sourceType: recordType, sourceId: recordId },
      { targetType: recordType, targetId: recordId }
    ]
  })
    .populate('createdBy', 'displayName email')
    .sort({ createdAt: -1 });

  const enriched = await Promise.all(
    relationships.map(async (rel) => {
      const [sourceRec, targetRec] = await Promise.all([
        findRecordByIdAndType(rel.sourceType, rel.sourceId, organizationId, shipment._id),
        findRecordByIdAndType(rel.targetType, rel.targetId, organizationId, shipment._id)
      ]);

      const isOutgoing = rel.sourceType === recordType && rel.sourceId.toString() === recordId.toString();

      return {
        ...rel.toObject(),
        isOutgoing,
        connectedType: isOutgoing ? rel.targetType : rel.sourceType,
        connectedId: isOutgoing ? rel.targetId : rel.sourceId,
        connectedSummary: isOutgoing
          ? getRecordSummaryLabel(rel.targetType, targetRec)
          : getRecordSummaryLabel(rel.sourceType, sourceRec),
        connectedRecord: isOutgoing ? targetRec : sourceRec
      };
    })
  );

  return {
    recordType,
    recordId,
    totalRelationships: enriched.length,
    relationships: enriched
  };
}

export async function deleteRelationship({ organizationId, shipmentId, relationshipId, actingUser, req }) {
  const relationship = await EventRelationship.findOne({
    _id: relationshipId,
    organization: organizationId,
    shipment: shipmentId
  });

  if (!relationship) {
    throw new AppError('Relationship record not found or inaccessible.', 404, 'RELATIONSHIP_NOT_FOUND');
  }

  await EventRelationship.deleteOne({ _id: relationship._id });

  await recordAudit({
    action: 'EVENT_RELATIONSHIP_DELETED',
    userId: actingUser.id,
    organizationId,
    details: {
      shipmentId,
      relationshipId: relationship._id.toString(),
      sourceType: relationship.sourceType,
      sourceId: relationship.sourceId,
      targetType: relationship.targetType,
      targetId: relationship.targetId,
      relationshipType: relationship.relationshipType
    },
    req
  });

  return { message: 'Relationship link successfully removed.', relationshipId };
}

export async function searchCandidateRecords({ organizationId, shipmentId, targetType, query = '' }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const candidateList = [];

  switch (targetType) {
    case 'shipment': {
      candidateList.push({
        id: shipment._id.toString(),
        type: 'shipment',
        title: `Shipment ${shipment.shipmentReference}`,
        subtitle: `${shipment.origin} → ${shipment.destination}`,
        date: shipment.createdAt,
        badge: shipment.status
      });
      break;
    }
    case 'custody': {
      const items = await CustodyEvent.find({ shipment: shipment._id, organization: organizationId }).sort({ occurredAt: -1 });
      items.forEach((c) => {
        candidateList.push({
          id: c._id.toString(),
          type: 'custody',
          title: `Handover [${c.eventType}]`,
          subtitle: `${c.fromParty || 'Origin'} → ${c.toParty || 'Dest'} at ${c.location}`,
          date: c.occurredAt || c.createdAt,
          badge: c.confirmationStatus
        });
      });
      break;
    }
    case 'inspection': {
      const items = await Inspection.find({ shipment: shipment._id, organization: organizationId }).sort({ inspectedAt: -1 });
      items.forEach((i) => {
        candidateList.push({
          id: i._id.toString(),
          type: 'inspection',
          title: `Inspection [${i.inspectionType}]`,
          subtitle: `Condition: ${i.overallCondition} | Seal: ${i.sealCondition} at ${i.location}`,
          date: i.inspectedAt || i.createdAt,
          badge: i.visibleDamage ? 'DAMAGE_REPORTED' : 'GOOD'
        });
      });
      break;
    }
    case 'incident': {
      const items = await DamageIncident.find({ shipment: shipment._id, organization: organizationId }).sort({ reportedAt: -1 });
      items.forEach((inc) => {
        candidateList.push({
          id: inc._id.toString(),
          type: 'incident',
          title: `Incident [${inc.incidentReference}] — ${inc.title}`,
          subtitle: `Severity: ${inc.severity} | Location: ${inc.location}`,
          date: inc.discoveredAt || inc.createdAt,
          badge: inc.status
        });
      });
      break;
    }
    case 'evidence': {
      const items = await Evidence.find({ shipment: shipment._id, organization: organizationId }).sort({ uploadedAt: -1 });
      items.forEach((e) => {
        candidateList.push({
          id: e._id.toString(),
          type: 'evidence',
          title: `Evidence [${e.evidenceReference}] — ${e.originalFilename}`,
          subtitle: `Type: ${e.evidenceType} | SHA256: ${e.sha256 ? e.sha256.slice(0, 16) + '...' : 'N/A'}`,
          date: e.uploadedAt || e.createdAt,
          badge: 'VERIFIED'
        });
      });
      break;
    }
    default:
      break;
  }

  // Filter by search query if provided
  let filtered = candidateList;
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = candidateList.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }

  return { targetType, totalCandidates: filtered.length, candidates: filtered };
}

export async function getInvestigationGraph({ organizationId, shipmentId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const [custodyEvents, inspections, incidents, evidenceList, reports, relationships] = await Promise.all([
    CustodyEvent.find({ shipment: shipment._id, organization: organizationId }),
    Inspection.find({ shipment: shipment._id, organization: organizationId }),
    DamageIncident.find({ shipment: shipment._id, organization: organizationId }),
    Evidence.find({ shipment: shipment._id, organization: organizationId }),
    AIInvestigationReport.find({ shipment: shipment._id, organization: organizationId }),
    EventRelationship.find({ shipment: shipment._id, organization: organizationId }).populate('createdBy', 'displayName email')
  ]);

  const nodes = [];

  // Root Node: Shipment
  nodes.push({
    id: `shipment_${shipment._id}`,
    recordId: shipment._id.toString(),
    type: 'shipment',
    label: `Shipment ${shipment.shipmentReference}`,
    details: `${shipment.origin} → ${shipment.destination}`,
    status: shipment.status
  });

  custodyEvents.forEach((c) => {
    nodes.push({
      id: `custody_${c._id}`,
      recordId: c._id.toString(),
      type: 'custody',
      label: `Handover: ${c.eventType}`,
      details: `${c.fromParty || 'Origin'} → ${c.toParty || 'Dest'} (${c.location})`,
      status: c.confirmationStatus
    });
  });

  inspections.forEach((i) => {
    nodes.push({
      id: `inspection_${i._id}`,
      recordId: i._id.toString(),
      type: 'inspection',
      label: `Inspection: ${i.inspectionType}`,
      details: `Condition: ${i.overallCondition} at ${i.location}`,
      status: i.visibleDamage ? 'DAMAGE_OBSERVED' : 'GOOD'
    });
  });

  incidents.forEach((inc) => {
    nodes.push({
      id: `incident_${inc._id}`,
      recordId: inc._id.toString(),
      type: 'incident',
      label: `Incident [${inc.incidentReference}]`,
      details: `${inc.title} (${inc.severity})`,
      status: inc.status
    });
  });

  evidenceList.forEach((e) => {
    nodes.push({
      id: `evidence_${e._id}`,
      recordId: e._id.toString(),
      type: 'evidence',
      label: `Evidence [${e.evidenceReference}]`,
      details: `${e.originalFilename} (${e.evidenceType})`,
      status: e.sha256 ? 'SHA256_VERIFIED' : 'UNINDEXED'
    });
  });

  reports.forEach((r) => {
    nodes.push({
      id: `report_${r._id}`,
      recordId: r._id.toString(),
      type: 'report',
      label: `AI Report v${r.version}`,
      details: `Risk: ${r.overallRiskLevel} | Model: ${r.modelIdentifier}`,
      status: r.status
    });
  });

  // Build edges ONLY from explicit persisted relationships
  const edges = relationships.map((rel) => ({
    id: rel._id.toString(),
    sourceNodeId: `${rel.sourceType}_${rel.sourceId}`,
    targetNodeId: `${rel.targetType}_${rel.targetId}`,
    sourceType: rel.sourceType,
    sourceId: rel.sourceId.toString(),
    targetType: rel.targetType,
    targetId: rel.targetId.toString(),
    relationshipType: rel.relationshipType,
    explanation: rel.explanation,
    createdBy: rel.createdBy?.displayName || 'Investigator',
    createdAt: rel.createdAt
  }));

  return {
    shipmentId: shipment._id.toString(),
    shipmentReference: shipment.shipmentReference,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodes,
    edges
  };
}

