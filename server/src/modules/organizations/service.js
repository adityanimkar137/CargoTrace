/**
 * CargoTrace Organization Service
 * Business logic for retrieving organization context, members, and managing memberships.
 */
import crypto from 'node:crypto';
import { Organization } from './model.js';
import { Membership } from '../memberships/model.js';
import { User } from '../users/model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function getCurrentOrganizationDetails(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
  }

  const memberCount = await Membership.countDocuments({
    organization: organizationId,
    status: 'active'
  });

  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    status: org.status,
    createdAt: org.createdAt,
    memberCount
  };
}

export async function getOrganizationMembers(organizationId) {
  const memberships = await Membership.find({
    organization: organizationId
  })
    .populate('user', 'email displayName status lastLoginAt')
    .sort({ createdAt: 1 });

  return memberships.map((m) => ({
    membershipId: m._id.toString(),
    userId: m.user?._id?.toString() || null,
    email: m.user?.email || 'N/A',
    displayName: m.user?.displayName || 'Unknown',
    userStatus: m.user?.status || 'inactive',
    role: m.role,
    membershipStatus: m.status,
    joinedAt: m.createdAt
  }));
}

export async function addMemberToOrganization({ organizationId, email, displayName, role, password, actingUser, req }) {
  // 1. Strictly enforce provided password
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('A secure password of at least 8 characters is required.', 400, 'INVALID_PASSWORD');
  }
  const passwordHash = await User.hashPassword(password);

  // 2. Check if user already exists
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      passwordHash,
      displayName: displayName || email.split('@')[0],
      status: 'active'
    });
  } else {
    // If user exists, update user's password with the admin-assigned password
    user.passwordHash = passwordHash;
    if (displayName) user.displayName = displayName;
    await user.save();
  }

  // 3. Check if membership already exists in this organization
  const existingMembership = await Membership.findOne({
    user: user._id,
    organization: organizationId
  });

  if (existingMembership) {
    if (existingMembership.status === 'active') {
      throw new AppError('User is already an active member of this organization.', 409, 'MEMBER_ALREADY_EXISTS');
    }

    // Re-activate existing membership with new role
    existingMembership.status = 'active';
    existingMembership.role = role;
    await existingMembership.save();

    await recordAudit({
      action: 'MEMBER_ROLE_UPDATED',
      userId: actingUser.id,
      organizationId,
      details: { targetUserId: user._id, targetEmail: email, role },
      req
    });

    return {
      membershipId: existingMembership._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: existingMembership.role,
      status: existingMembership.status,
      temporaryPassword: password
    };
  }

  // 4. Create new membership
  const membership = await Membership.create({
    user: user._id,
    organization: organizationId,
    role,
    status: 'active'
  });

  await recordAudit({
    action: 'MEMBER_ADDED',
    userId: actingUser.id,
    organizationId,
    details: { targetUserId: user._id, targetEmail: email, role },
    req
  });

  return {
    membershipId: membership._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: membership.role,
    status: membership.status,
    temporaryPassword: password
  };
}

export async function resetMemberPassword({ organizationId, userId, password, actingUser, req }) {
  // Verify membership belongs to this organization
  const membership = await Membership.findOne({
    user: userId,
    organization: organizationId,
    status: 'active'
  }).populate('user');

  if (!membership || !membership.user) {
    throw new AppError('Member not found in active organization.', 404, 'MEMBER_NOT_FOUND');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('A new secure password of at least 8 characters is required.', 400, 'INVALID_PASSWORD');
  }
  const passwordHash = await User.hashPassword(password);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
  }

  user.passwordHash = passwordHash;
  await user.save();

  await recordAudit({
    action: 'MEMBER_PASSWORD_RESET',
    userId: actingUser.id,
    organizationId,
    details: { targetUserId: user._id, targetEmail: user.email, role: membership.role },
    req
  });

  return {
    userId: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: membership.role,
    temporaryPassword: password
  };
}

