/**
 * CargoTrace Cargo Condition Inspection Model
 * Records physical condition checks at origin, transfer points, hubs, and destination.
 */
import mongoose from 'mongoose';

export const INSPECTION_TYPES = ['ORIGIN', 'CUSTODY_TRANSFER', 'HUB', 'DESTINATION', 'OTHER'];
export const CONDITION_VALUES = ['GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'UNKNOWN'];
export const SEAL_CONDITIONS = ['INTACT', 'DAMAGED', 'BROKEN_SEAL', 'NOT_APPLICABLE', 'UNKNOWN'];

const inspectionSchema = new mongoose.Schema(
  {
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
    inspectionType: {
      type: String,
      enum: INSPECTION_TYPES,
      required: [true, 'Inspection category is required']
    },
    location: {
      type: String,
      required: [true, 'Inspection location is required'],
      trim: true
    },
    inspectedAt: {
      type: Date,
      required: [true, 'Inspection date/time is required']
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    overallCondition: {
      type: String,
      enum: CONDITION_VALUES,
      default: 'UNKNOWN'
    },
    packagingCondition: {
      type: String,
      enum: CONDITION_VALUES,
      default: 'UNKNOWN'
    },
    sealCondition: {
      type: String,
      enum: SEAL_CONDITIONS,
      default: 'UNKNOWN'
    },
    visibleDamage: {
      type: Boolean,
      default: false
    },
    damageDescription: {
      type: String,
      trim: true
    },
    observations: {
      type: String,
      trim: true
    },
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

inspectionSchema.index({ organization: 1, shipment: 1, inspectedAt: -1 });

export const Inspection = mongoose.model('Inspection', inspectionSchema);
