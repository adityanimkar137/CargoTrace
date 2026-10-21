/**
 * CargoTrace Audit Log Model
 * Tracks security-sensitive events, membership changes, and tenant activities.
 */
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    requestId: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Prevent updating audit log entries
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are append-only and cannot be modified');
});
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are append-only and cannot be modified');
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export async function recordAudit({ action, userId, organizationId, details, req }) {
  try {
    await AuditLog.create({
      action,
      userId,
      organizationId,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      requestId: req?.id
    });
  } catch (err) {
    // Audit log failure should be logged but never silently crash primary operations
    console.error('Failed to write audit log:', err.message);
  }
}
