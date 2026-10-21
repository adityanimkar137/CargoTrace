/**
 * CargoTrace Evidence Metadata Model
 * Stores metadata and Firebase Storage or secure object path references for cargo evidence.
 */
import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const EVIDENCE_TYPES = [
  'CARGO_PHOTO',
  'PACKAGING_PHOTO',
  'SEAL_PHOTO',
  'INSPECTION_PHOTO',
  'DOCUMENT',
  'OTHER'
];

const evidenceSchema = new mongoose.Schema(
  {
    evidenceReference: {
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
    originalFilename: {
      type: String,
      required: true,
      trim: true
    },
    storagePath: {
      type: String,
      required: true
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'fs.files'
    },
    fileUrl: {
      type: String,
      required: true
    },
    storageMode: {
      type: String,
      enum: ['firebase', 'local', 'gridfs'],
      default: 'gridfs'
    },
    contentType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    },
    sha256: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true
    },
    evidenceType: {
      type: String,
      enum: EVIDENCE_TYPES,
      default: 'CARGO_PHOTO'
    },
    custodyEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustodyEvent'
    },
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection'
    },
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DamageIncident'
    }
  },
  {
    timestamps: true
  }
);

evidenceSchema.index({ organization: 1, shipment: 1, uploadedAt: -1 });

evidenceSchema.statics.generateReference = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EVD-${year}${month}-${randomHex}`;
};

export const Evidence = mongoose.model('Evidence', evidenceSchema);
