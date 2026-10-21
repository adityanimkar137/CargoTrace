/**
 * CargoTrace User Model
 * Stores user account credentials, profile, and account status.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Never returned in normal queries
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'deactivated', 'suspended'],
      default: 'active',
      index: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password against bcrypt hash
userSchema.methods.verifyPassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
