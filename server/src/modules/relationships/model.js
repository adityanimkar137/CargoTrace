/**
 * CargoTrace Event Relationship Model
 * Persists explicit, validated, bidirectional investigation relationships between entities
 * (Shipments, Custody Events, Inspections, Incidents, Evidence Artifacts, Anomalies, Reports).
 */
import mongoose from 'mongoose';

export const RECORD_TYPES = [
  'shipment',
  'custody',
  'inspection',
  'incident',
  'evidence',
  'anomaly',
  'review',
  'report'
];

export const RELATIONSHIP_TYPES = [
  'SHIPMENT_HAS_CUSTODY_EVENT',
  'SHIPMENT_HAS_INSPECTION',
  'SHIPMENT_HAS_INCIDENT',
  'SHIPMENT_HAS_EVIDENCE',
  'CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT',
  'INSPECTION_OBSERVED_DURING_CUSTODY',
  'INSPECTION_DOCUMENTS_INCIDENT',
  'INCIDENT_SUPPORTED_BY_EVIDENCE',
  'INSPECTION_SUPPORTED_BY_EVIDENCE',
  'EVIDENCE_CORROBORATES_EVIDENCE',
  'INCIDENT_OCCURRED_DURING_CUSTODY',
  'ANOMALY_CONCERNS_RECORD',
  'REPORT_CITES_RECORD'
];

export const RELATIONSHIP_DESCRIPTIONS = {
  SHIPMENT_HAS_CUSTODY_EVENT: 'Shipment incorporates this chain-of-custody transfer event',
  SHIPMENT_HAS_INSPECTION: 'Shipment incorporates this condition inspection check',
  SHIPMENT_HAS_INCIDENT: 'Shipment encompasses this damage or security incident',
  SHIPMENT_HAS_EVIDENCE: 'Shipment links this digital evidence artifact',
  CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT: 'Chronological custody sequence handover connection',
  INSPECTION_OBSERVED_DURING_CUSTODY: 'Condition inspection occurred during specific custody interval',
  INSPECTION_DOCUMENTS_INCIDENT: 'Inspection findings document or observe this damage incident',
  INCIDENT_SUPPORTED_BY_EVIDENCE: 'Damage incident is corroborated by this evidence photo/document',
  INSPECTION_SUPPORTED_BY_EVIDENCE: 'Condition inspection is supported by attached evidence photo/document',
  EVIDENCE_CORROBORATES_EVIDENCE: 'Evidence artifact corroborates or validates another evidence artifact',
  INCIDENT_OCCURRED_DURING_CUSTODY: 'Damage incident occurred during specific carrier/custodian interval',
  ANOMALY_CONCERNS_RECORD: 'Deterministic anomaly directly concerns or highlights this operational record',
  REPORT_CITES_RECORD: 'AI Case Report explicitly cites this verified record'
};

const eventRelationshipSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      enum: RECORD_TYPES,
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: RECORD_TYPES,
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    relationshipType: {
      type: String,
      enum: RELATIONSHIP_TYPES,
      required: true
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate identical relationships between the exact same source, target, and relationship type
eventRelationshipSchema.index(
  { organization: 1, shipment: 1, sourceType: 1, sourceId: 1, targetType: 1, targetId: 1, relationshipType: 1 },
  { unique: true }
);

export const EventRelationship = mongoose.model('EventRelationship', eventRelationshipSchema);
