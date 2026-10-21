/**
 * CargoTrace Organization Routes
 * Enforces authentication and organization-scoped authorization.
 */
import { Router } from 'express';
import { organizationController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { addMemberSchema, resetMemberPasswordSchema } from './validation.js';

const router = Router();

// All organization routes require authenticated session with active membership
router.use(authenticate);

// Get current organization details
router.get('/current', organizationController.getCurrent);

// Get members of the current organization
router.get('/current/members', organizationController.getMembers);

// Add member to current organization (admin only)
router.post(
  '/current/members',
  requireRole('admin'),
  validate({ body: addMemberSchema }),
  organizationController.addMember
);

// Reset a member's temporary password (admin only)
router.post(
  '/current/members/:userId/reset-password',
  requireRole('admin'),
  validate({ body: resetMemberPasswordSchema }),
  organizationController.resetPassword
);

export default router;
