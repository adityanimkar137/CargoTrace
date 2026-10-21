/**
 * CargoTrace Evidence Controller
 */
import path from 'node:path';
import mongoose from 'mongoose';
import {
  uploadEvidence,
  getEvidenceByShipment,
  getEvidenceById
} from './service.js';
import { getGridFSBucket } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export const evidenceController = {
  async upload(req, res, next) {
    try {
      const evidence = await uploadEvidence({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id,
        file: req.file,
        data: req.body,
        userId: req.user.id,
        req
      });

      res.status(201).json({
        message: 'Evidence uploaded and registered successfully.',
        evidence
      });
    } catch (err) {
      next(err);
    }
  },

  async listByShipment(req, res, next) {
    try {
      const evidence = await getEvidenceByShipment({
        shipmentId: req.params.shipmentId,
        organizationId: req.organization.id
      });

      res.json({ evidence });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const evidence = await getEvidenceById({
        evidenceId: req.params.id,
        organizationId: req.organization.id
      });

      res.json({ evidence });
    } catch (err) {
      next(err);
    }
  },

  async streamFile(req, res, next) {
    try {
      const evidence = await getEvidenceById({
        evidenceId: req.params.id,
        organizationId: req.organization.id
      });

      if (evidence.storageMode === 'gridfs' || evidence.gridFsFileId || (evidence.storagePath && evidence.storagePath.startsWith('gridfs:'))) {
        const bucket = getGridFSBucket();
        const fileId = evidence.gridFsFileId || new mongoose.Types.ObjectId(evidence.storagePath.replace('gridfs:', ''));

        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) {
          throw new AppError('File not found in storage.', 404, 'FILE_NOT_FOUND');
        }

        res.setHeader('Content-Type', evidence.contentType || files[0].contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${evidence.originalFilename.replace(/"/g, '')}"`);

        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on('error', (err) => {
          if (!res.headersSent) {
            next(new AppError('Error streaming file: ' + err.message, 500, 'STREAM_ERROR'));
          }
        });
        downloadStream.pipe(res);
        return;
      }

      if (evidence.storageMode === 'firebase' || (evidence.fileUrl && evidence.fileUrl.startsWith('https://'))) {
        return res.redirect(evidence.fileUrl);
      }

      if (evidence.storageMode === 'local' || (evidence.fileUrl && evidence.fileUrl.startsWith('/uploads/'))) {
        const localPath = path.resolve(process.cwd(), 'public', evidence.fileUrl.replace(/^\//, ''));
        return res.sendFile(localPath, {
          headers: {
            'Content-Type': evidence.contentType,
            'Content-Disposition': `inline; filename="${evidence.originalFilename.replace(/"/g, '')}"`
          }
        });
      }

      throw new AppError('Unsupported storage mode or file missing.', 404, 'FILE_NOT_FOUND');
    } catch (err) {
      next(err);
    }
  }
};
