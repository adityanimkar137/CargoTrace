/**
 * CargoTrace Membership Model
 * Defines the user's role and status within a specific Organization.
 */
import mongoose from 'mongoose';

export const VALID_ROLES = ['admin', 'investigator', 'reviewer', 'viewer'];

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      required: true,
      default: 'viewer'
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique user per organization
membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
