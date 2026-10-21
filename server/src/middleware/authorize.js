/**
 * CargoTrace Authorization Middleware
 * Enforces role and permission boundaries derived from validated server identity.
 */
import { AppError } from './errorHandler.js';
import { hasPermission } from '../modules/auth/permissions.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return next(new AppError('Authentication and organization membership required', 401, 'UNAUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(
        new AppError(
          `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.userRole}`,
          403,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.userRole) {
      return next(new AppError('Authentication and organization membership required', 401, 'UNAUTHENTICATED'));
    }

    if (!hasPermission(req.userRole, permission)) {
      return next(
        new AppError(
          `Forbidden: You lack the required permission (${permission}) to perform this action.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
