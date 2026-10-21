/**
 * CargoTrace Damage Incident Model
 * Tracks reported damage events, affected cargo items, discovery location, and status.
 */
import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const DAMAGE_TYPES = [
  'PACKAGING_DAMAGE',
  'PHYSICAL_DAMAGE',
  'WATER_DAMAGE',
  'CONTAMINATION',
  'MISSING_OR_DAMAGED_PARTS',
  'OTHER'
];

export const SEVERITY_LEVELS = ['MINOR', 'MODERATE', 'MAJOR', 'UNKNOWN'];
export const INCIDENT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED'];

const damageIncidentSchema = new mongoose.Schema(
  {
    incidentReference: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Damage observations description is required'],
      trim: true
    },
    damageType: {
      type: String,
      enum: DAMAGE_TYPES,
      required: [true, 'Damage category is required']
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      default: 'UNKNOWN'
    },
    location: {
      type: String,
      required: [true, 'Discovery location is required'],
      trim: true
    },
    occurredAt: {
      type: Date
    },
    discoveredAt: {
      type: Date,
      required: [true, 'Discovery date/time is required']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    affectedCargo: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: INCIDENT_STATUSES,
      default: 'OPEN',
      index: true
    },
    resolutionNotes: {
      type: String,
      trim: true
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    relatedInspections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspection'
      }
    ],
    relatedCustodyEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustodyEvent'
      }
    ],
    evidence: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence'
      }
    ]
  },
  {
    timestamps: true
  }
);

damageIncidentSchema.index({ organization: 1, shipment: 1, reportedAt: -1 });

damageIncidentSchema.statics.generateReference = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INC-${year}${month}-${randomHex}`;
};

export const DamageIncident = mongoose.model('DamageIncident', damageIncidentSchema);
