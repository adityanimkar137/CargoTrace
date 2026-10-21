/**
 * CargoTrace Session Model
 * MongoDB-backed session persistence with TTL auto-expiration.
 */
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    activeOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index removes expired documents automatically
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const Session = mongoose.model('Session', sessionSchema);
