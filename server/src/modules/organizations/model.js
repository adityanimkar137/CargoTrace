/**
 * CargoTrace Organization Model
 * Represents the primary tenant boundary for multi-tenant isolation.
 */
import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'suspended'],
      default: 'active',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Helper to generate a clean URL-friendly slug
organizationSchema.statics.generateSlug = function (name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40) || 'org';
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
};

export const Organization = mongoose.model('Organization', organizationSchema);
