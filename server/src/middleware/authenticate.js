/**
 * CargoTrace Authentication Middleware
 * Validates session token from HTTP-only cookie or Bearer header against MongoDB.
 * Enforces active account and organization membership.
 */
import { AppError } from './errorHandler.js';
import { Session } from '../modules/auth/sessionModel.js';
import { Membership } from '../modules/memberships/model.js';
import { getDatabaseStatus } from '../config/database.js';

export const SESSION_COOKIE_NAME = 'cargotrace_session';

export async function authenticate(req, res, next) {
  try {
    // 1. Extract session token from cookie or Authorization header
    let token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    // Unauthenticated request (normal for anonymous visitors)
    // Send 401 response directly without throwing an Express error
    if (!token) {
      return res.status(401).json({
        user: null,
        organization: null,
        authenticated: false,
        message: 'Authentication required. No session token provided.'
      });
    }

    // 2. Check database availability only when validating a present token
    const dbStatus = getDatabaseStatus();
    if (!dbStatus.connected) {
      throw new AppError(
        'Database service is unavailable. Please verify MONGODB_URI configuration.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    // 3. Retrieve active session from MongoDB
    const session = await Session.findOne({
      sessionToken: token,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!session || !session.user) {
      return res.status(401).json({
        user: null,
        organization: null,
        authenticated: false,
        message: 'Session expired or invalid. Please log in again.'
      });
    }

    const user = session.user;
    if (user.status !== 'active') {
      throw new AppError('Account is inactive or suspended. Please contact your organization administrator.', 403, 'ACCOUNT_SUSPENDED');
    }

    // 4. Retrieve and verify active organization membership
    const membership = await Membership.findOne({
      user: user._id,
      organization: session.activeOrganization,
      status: 'active'
    }).populate('organization');

    if (!membership || !membership.organization) {
      throw new AppError('You do not have active access to the specified organization.', 403, 'ORGANIZATION_ACCESS_DENIED');
    }

    // Attach verified identity and context to request
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      status: user.status
    };
    req.session = session;
    req.organization = {
      id: membership.organization._id.toString(),
      _id: membership.organization._id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      status: membership.organization.status,
      createdAt: membership.organization.createdAt
    };
    req.membership = membership;
    req.userRole = membership.role;

    next();
  } catch (err) {
    next(err);
  }
}
