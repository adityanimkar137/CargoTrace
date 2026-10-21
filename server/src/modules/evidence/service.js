/**
 * CargoTrace Evidence Service
 * Handles secure storage (Firebase Storage / MongoDB GridFS / Local Fallback), SHA-256 integrity hashing, metadata persistence, and linking.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { Evidence } from './model.js';
import { Shipment } from '../shipments/model.js';
import { AIInvestigationReport } from '../investigation/model.js';
import { CustodyEvent } from '../custody/model.js';
import { Inspection } from '../inspections/model.js';
import { DamageIncident } from '../incidents/model.js';
import { EventRelationship } from '../relationships/model.js';
import { getFirebaseStatus, getStorageBucket } from '../../config/firebase.js';
import { getGridFSBucket } from '../../config/database.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/env.js';

export async function uploadEvidence({ shipmentId, organizationId, file, data, userId, req }) {
  if (!file || !file.buffer) {
    throw new AppError('No file provided for evidence upload.', 400, 'MISSING_FILE');
  }

  const fbStatus = getFirebaseStatus();
  const isProd = (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production');

  // 1. Verify shipment ownership
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
    throw new AppError('This shipment has a certified and sealed investigation report. No new evidence files can be uploaded.', 409, 'SHIPMENT_REPORT_SEALED');
  }

  // 2. Compute SHA-256 hash for file integrity
  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // 3. Generate unique reference
  let evidenceReference = Evidence.generateReference();
  let attempts = 0;
  while (attempts < 3) {
    const existing = await Evidence.findOne({ evidenceReference });
    if (!existing) break;
    evidenceReference = Evidence.generateReference();
    attempts++;
  }

  const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');

  let storagePath = '';
  let fileUrl = '';
  let storageMode = 'gridfs';
  let gridFsFileId = null;

  // 4. Store file (Firebase Storage if initialized, otherwise MongoDB GridFS, with local disk fallback in dev)
  if (fbStatus.initialized) {
    try {
      const bucket = getStorageBucket();
      storagePath = `evidence/${organizationId}/${shipment._id}/${evidenceReference}_${sanitizedFilename}`;
      const bucketFile = bucket.file(storagePath);

      await bucketFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            sha256,
            evidenceReference,
            shipmentId: shipment._id.toString(),
            organizationId: organizationId.toString(),
            uploadedBy: userId.toString()
          }
        }
      });

      const [signedUrl] = await bucketFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      fileUrl = signedUrl;
      storageMode = 'firebase';
    } catch (fbErr) {
      if (isProd) {
        throw new AppError(
          `Firebase Storage upload failed in production mode: ${fbErr.message}`,
          500,
          'FIREBASE_UPLOAD_FAILED'
        );
      }
      console.warn('Firebase Storage upload failed, falling back to GridFS:', fbErr.message);
      storageMode = 'gridfs';
    }
  }

  if (storageMode === 'gridfs') {
    try {
      const bucket = getGridFSBucket();
      const filename = `${evidenceReference}_${sanitizedFilename}`;
      gridFsFileId = new mongoose.Types.ObjectId();

      await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStreamWithId(gridFsFileId, filename, {
          contentType: file.mimetype,
          metadata: {
            sha256,
            evidenceReference,
            shipmentId: shipment._id.toString(),
            organizationId: organizationId.toString(),
            uploadedBy: userId.toString()
          }
        });
        uploadStream.on('error', reject);
        uploadStream.on('finish', resolve);
        uploadStream.end(file.buffer);
      });

      storagePath = `gridfs:${gridFsFileId.toString()}`;
    } catch (gridFsErr) {
      if (isProd) {
        throw new AppError(
          `GridFS storage upload failed in production mode: ${gridFsErr.message}`,
          500,
          'GRIDFS_UPLOAD_FAILED'
        );
      }
      console.warn('GridFS upload failed, falling back to local storage:', gridFsErr.message);
      storageMode = 'local';
    }
  }

  if (storageMode === 'local') {
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'evidence');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filenameOnDisk = `${evidenceReference}_${sanitizedFilename}`;
    const filePathOnDisk = path.join(uploadsDir, filenameOnDisk);
    await fs.writeFile(filePathOnDisk, file.buffer);

    storagePath = `uploads/evidence/${filenameOnDisk}`;
    fileUrl = `/uploads/evidence/${filenameOnDisk}`;
  }

  // Pre-generate evidence _id so GridFS fileUrl can point to the secure streaming endpoint
  const evidenceId = new mongoose.Types.ObjectId();
  if (storageMode === 'gridfs') {
    fileUrl = `/api/v1/evidence/${evidenceId.toString()}/file`;
  }

  // 5. Create Evidence metadata document
  const evidence = await Evidence.create({
    _id: evidenceId,
    evidenceReference,
    shipment: shipment._id,
    organization: organizationId,
    originalFilename: file.originalname,
    storagePath,
    gridFsFileId: gridFsFileId || undefined,
    fileUrl,
    storageMode,
    contentType: file.mimetype,
    sizeBytes: file.size,
    sha256,
    uploadedBy: userId,
    uploadedAt: new Date(),
    description: data.description || null,
    evidenceType: data.evidenceType || 'CARGO_PHOTO',
    custodyEvent: data.custodyEventId || null,
    inspection: data.inspectionId || null,
    incident: data.incidentId || null
  });

  // 6. Optionally link evidence to parent entity if provided
  if (data.custodyEventId) {
    await CustodyEvent.updateOne(
      { _id: data.custodyEventId, organization: organizationId },
      { $addToSet: { evidence: evidence._id } }
    );
  }
  if (data.inspectionId) {
    await Inspection.updateOne(
      { _id: data.inspectionId, organization: organizationId },
      { $addToSet: { evidence: evidence._id } }
    );
  }
  if (data.incidentId) {
    await DamageIncident.updateOne(
      { _id: data.incidentId, organization: organizationId },
      { $addToSet: { evidence: evidence._id } }
    );
  }

  await recordAudit({
    action: 'EVIDENCE_UPLOADED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      evidenceId: evidence._id.toString(),
      evidenceReference: evidence.evidenceReference,
      filename: evidence.originalFilename,
      sizeBytes: evidence.sizeBytes,
      sha256: evidence.sha256,
      storageMode
    },
    req
  });

  return evidence.populate([
    { path: 'uploadedBy', select: 'displayName email' }
  ]);
}

export async function getEvidenceByShipment({ shipmentId, organizationId }) {
  const shipment = await Shipment.findOne({ _id: shipmentId, organization: organizationId });
  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  // Find linked inspections, incidents, and persisted event relationships for this shipment
  const [inspections, incidents, relationships] = await Promise.all([
    Inspection.find({ shipment: shipment._id, organization: organizationId }).select('_id evidence'),
    DamageIncident.find({ shipment: shipment._id, organization: organizationId }).select('_id evidence'),
    EventRelationship.find({ shipment: shipment._id, organization: organizationId })
  ]);

  const linkedEvidenceIds = new Set();
  inspections.forEach((insp) => {
    (insp.evidence || []).forEach((eId) => linkedEvidenceIds.add(eId.toString()));
  });
  incidents.forEach((inc) => {
    (inc.evidence || []).forEach((eId) => linkedEvidenceIds.add(eId.toString()));
  });
  relationships.forEach((rel) => {
    if (rel.targetType === 'evidence' && rel.targetId) {
      linkedEvidenceIds.add(rel.targetId.toString());
    }
    if (rel.sourceType === 'evidence' && rel.sourceId) {
      linkedEvidenceIds.add(rel.sourceId.toString());
    }
  });

  const queryConditions = [
    { shipment: shipment._id }
  ];
  if (inspections.length > 0) {
    queryConditions.push({ inspection: { $in: inspections.map((i) => i._id) } });
  }
  if (incidents.length > 0) {
    queryConditions.push({ incident: { $in: incidents.map((i) => i._id) } });
  }
  if (linkedEvidenceIds.size > 0) {
    queryConditions.push({ _id: { $in: Array.from(linkedEvidenceIds) } });
  }

  const evidenceRecords = await Evidence.find({
    organization: organizationId,
    $or: queryConditions
  })
    .populate('uploadedBy', 'displayName email')
    .sort({ uploadedAt: -1 });

  return evidenceRecords;
}

export async function getEvidenceById({ evidenceId, organizationId }) {
  const evidence = await Evidence.findOne({
    _id: evidenceId,
    organization: organizationId
  })
    .populate('shipment', 'shipmentReference description')
    .populate('uploadedBy', 'displayName email');

  if (!evidence) {
    throw new AppError('Evidence record not found or inaccessible.', 404, 'EVIDENCE_NOT_FOUND');
  }

  return evidence;
}
