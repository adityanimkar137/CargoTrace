/**
 * CargoTrace Shipment Model
 * Multi-tenant shipment entity with server-generated unique references and status control.
 */
import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const SHIPMENT_STATUSES = ['REGISTERED', 'IN_TRANSIT', 'ON_HOLD', 'ARRIVED', 'CLOSED'];

const shipmentSchema = new mongoose.Schema(
  {
    shipmentReference: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      immutable: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Shipment description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
      maxlength: [200, 'Origin location cannot exceed 200 characters']
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      maxlength: [200, 'Destination location cannot exceed 200 characters']
    },
    carrier: {
      type: String,
      trim: true,
      maxlength: [200, 'Carrier name cannot exceed 200 characters']
    },
    trackingReference: {
      type: String,
      trim: true,
      maxlength: [200, 'Tracking reference cannot exceed 200 characters']
    },
    status: {
      type: String,
      enum: {
        values: SHIPMENT_STATUSES,
        message: 'Invalid shipment status'
      },
      default: 'REGISTERED',
      index: true
    },
    expectedArrival: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Operational notes cannot exceed 2000 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
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

// Compound indexes for tenant-scoped querying
shipmentSchema.index({ organization: 1, createdAt: -1 });
shipmentSchema.index({ organization: 1, status: 1 });
shipmentSchema.index({ organization: 1, origin: 1 });
shipmentSchema.index({ organization: 1, destination: 1 });

/**
 * Server-side collision-safe shipment reference generator
 * Format: CT-YYYYMM-XXXX (e.g. CT-202610-8A3F)
 */
shipmentSchema.statics.generateReference = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CT-${year}${month}-${randomHex}`;
};

export const Shipment = mongoose.model('Shipment', shipmentSchema);
