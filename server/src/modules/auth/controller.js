/**
 * CargoTrace Authentication Controller
 * Orchestrates HTTP requests, responses, and session cookie lifecycle.
 */
import { registerUserAndOrganization, loginUser, logoutUser } from './service.js';
import { env } from '../../config/env.js';
import { SESSION_COOKIE_NAME } from '../../middleware/authenticate.js';
import { getRolePermissions } from './permissions.js';
import { Membership } from '../memberships/model.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

export const authController = {
  async register(req, res, next) {
    try {
      const result = await registerUserAndOrganization({
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.displayName,
        organizationName: req.body.organizationName,
        req
      });

      // Set secure HTTP-only session cookie
      res.cookie(SESSION_COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

      res.status(201).json({
        message: 'Registration and organization setup completed successfully.',
        token: result.sessionToken,
        user: result.user,
        organization: result.organization,
        role: result.role,
        permissions: getRolePermissions(result.role)
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await loginUser({
        email: req.body.email,
        password: req.body.password,
        req
      });

      // Set secure HTTP-only session cookie
      res.cookie(SESSION_COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

      res.json({
        message: 'Logged in successfully.',
        token: result.sessionToken,
        user: result.user,
        organization: result.organization,
        role: result.role,
        permissions: getRolePermissions(result.role)
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const token = req.cookies?.[SESSION_COOKIE_NAME] || req.session?.sessionToken;
      if (token) {
        await logoutUser({ sessionToken: token, req });
      }

      // Clear session cookie
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      res.json({ message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      // req.user, req.organization, req.userRole are already populated by authenticate middleware
      // Load all available organizations for this user
      const memberships = await Membership.find({
        user: req.user._id,
        status: 'active'
      }).populate('organization', 'name slug status createdAt');

      const organizations = memberships.map(m => ({
        id: m.organization._id.toString(),
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role
      }));

      res.json({
        user: req.user,
        organization: req.organization,
        role: req.userRole,
        permissions: getRolePermissions(req.userRole),
        organizations
      });
    } catch (err) {
      next(err);
    }
  }
};
