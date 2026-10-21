/**
 * CargoTrace Custody Event Model
 * Records cargo handovers, location changes, and custodian transitions.
 */
import mongoose from 'mongoose';

export const CUSTODY_EVENT_TYPES = [
  'CUSTODY_HANDOVER',
  'PICKUP',
  'HUB_ARRIVAL',
  'HUB_DEPARTURE',
  'RECEIPT_BY_CUSTODIAN',
  'OTHER'
];

export const CONFIRMATION_STATUSES = ['UNCONFIRMED', 'CONFIRMED', 'DISPUTED'];

const custodyEventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      enum: CUSTODY_EVENT_TYPES,
      required: [true, 'Custody event type is required']
    },
    fromParty: {
      type: String,
      trim: true
    },
    toParty: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    occurredAt: {
      type: Date,
      required: [true, 'Occurrence date/time is required']
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    evidence: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence'
      }
    ],
    confirmationStatus: {
      type: String,
      enum: CONFIRMATION_STATUSES,
      default: 'UNCONFIRMED'
    },
    acknowledgedByToParty: {
      type: Boolean,
      default: false
    },
    acknowledgementNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

custodyEventSchema.index({ organization: 1, shipment: 1, occurredAt: 1 });

export const CustodyEvent = mongoose.model('CustodyEvent', custodyEventSchema);
