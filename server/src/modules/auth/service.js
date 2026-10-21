/**
 * CargoTrace Authentication Service
 * Business logic for user registration, organization creation, login, session creation, and logout.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { User } from '../users/model.js';
import { Organization } from '../organizations/model.js';
import { Membership } from '../memberships/model.js';
import { Session } from './sessionModel.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getDatabaseStatus } from '../../config/database.js';

// Default session lifespan: 7 days
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyDatabaseConnected() {
  const dbStatus = getDatabaseStatus();
  if (!dbStatus.connected) {
    throw new AppError(
      'Database service is unavailable. Please ensure MONGODB_URI is configured.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }
}

export async function registerUserAndOrganization({ email, password, displayName, organizationName, req }) {
  verifyDatabaseConnected();

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409, 'ACCOUNT_ALREADY_EXISTS');
  }

  // Attempt multi-document transaction if replica set / Atlas supports it
  let session = null;
  const isReplicaSet = mongoose.connection.client?.topology?.description?.type !== 'Single';

  try {
    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const sessionOpts = session ? { session } : {};

    // 1. Hash password and create User
    const passwordHash = await User.hashPassword(password);
    const userDocs = await User.create(
      [
        {
          email,
          passwordHash,
          displayName,
          status: 'active',
          lastLoginAt: new Date()
        }
      ],
      sessionOpts
    );
    const user = userDocs[0];

    // 2. Generate slug and create Organization
    const slug = Organization.generateSlug(organizationName);
    const orgDocs = await Organization.create(
      [
        {
          name: organizationName,
          slug,
          status: 'active',
          createdBy: user._id
        }
      ],
      sessionOpts
    );
    const organization = orgDocs[0];

    // 3. Create initial Admin Membership
    const membershipDocs = await Membership.create(
      [
        {
          user: user._id,
          organization: organization._id,
          role: 'admin',
          status: 'active'
        }
      ],
      sessionOpts
    );
    const membership = membershipDocs[0];

    // 4. Create initial Session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const sessionDocs = await Session.create(
      [
        {
          sessionToken,
          user: user._id,
          activeOrganization: organization._id,
          expiresAt,
          ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
          userAgent: req?.headers?.['user-agent']
        }
      ],
      sessionOpts
    );
    const createdSession = sessionDocs[0];

    if (session) {
      await session.commitTransaction();
    }

    // 5. Record Security Audit Log
    await recordAudit({
      action: 'AUTH_REGISTER',
      userId: user._id,
      organizationId: organization._id,
      details: { organizationName: organization.name, role: 'admin' },
      req
    });

    return {
      sessionToken: createdSession.sessionToken,
      expiresAt: createdSession.expiresAt,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        status: user.status
      },
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        status: organization.status
      },
      role: membership.role
    };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export async function loginUser({ email, password, req }) {
  verifyDatabaseConnected();

  // Find user with passwordHash included
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    // Generic message to avoid email enumeration
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    throw new AppError('Account is inactive or suspended. Please contact an administrator.', 403, 'ACCOUNT_SUSPENDED');
  }

  // Verify password
  const isMatch = await user.verifyPassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Find active memberships
  const memberships = await Membership.find({
    user: user._id,
    status: 'active'
  }).populate('organization');

  if (!memberships || memberships.length === 0) {
    throw new AppError('No active organization membership found for this user.', 403, 'NO_ORGANIZATION_ACCESS');
  }

  // Use primary (first active) organization
  const primaryMembership = memberships[0];
  const organization = primaryMembership.organization;

  // Create new session in MongoDB
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await Session.create({
    sessionToken,
    user: user._id,
    activeOrganization: organization._id,
    expiresAt,
    ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
    userAgent: req?.headers?.['user-agent']
  });

  // Update user lastLoginAt
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  // Record audit log
  await recordAudit({
    action: 'AUTH_LOGIN',
    userId: user._id,
    organizationId: organization._id,
    details: { loginTime: new Date().toISOString() },
    req
  });

  return {
    sessionToken,
    expiresAt,
    user: {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      status: user.status
    },
    organization: {
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      status: organization.status
    },
    role: primaryMembership.role
  };
}

export async function logoutUser({ sessionToken, req }) {
  verifyDatabaseConnected();

  if (!sessionToken) return;

  const session = await Session.findOne({ sessionToken });
  if (session) {
    await Session.deleteOne({ _id: session._id });
    await recordAudit({
      action: 'AUTH_LOGOUT',
      userId: session.user,
      organizationId: session.activeOrganization,
      details: { logoutTime: new Date().toISOString() },
      req
    });
  }
}

