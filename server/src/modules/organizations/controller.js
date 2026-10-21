/**
 * CargoTrace Organization Controller
 */
import {
  getCurrentOrganizationDetails,
  getOrganizationMembers,
  addMemberToOrganization
} from './service.js';

export const organizationController = {
  async getCurrent(req, res, next) {
    try {
      const details = await getCurrentOrganizationDetails(req.organization.id);
      res.json({
        organization: {
          ...details,
          currentUserRole: req.userRole
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const members = await getOrganizationMembers(req.organization.id);
      res.json({
        organizationId: req.organization.id,
        members
      });
    } catch (err) {
      next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const newMember = await addMemberToOrganization({
        organizationId: req.organization.id,
        email: req.body.email,
        displayName: req.body.displayName,
        role: req.body.role,
        password: req.body.password,
        actingUser: req.user,
        req
      });

      res.status(201).json({
        message: 'Member added to organization successfully.',
        member: newMember,
        temporaryPassword: newMember.temporaryPassword
      });
    } catch (err) {
      console.error('addMember error:', err);
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const result = await resetMemberPassword({
        organizationId: req.organization.id,
        userId: req.params.userId,
        password: req.body.password,
        actingUser: req.user,
        req
      });

      res.json({
        message: 'Member password updated successfully.',
        member: result
      });
    } catch (err) {
      next(err);
    }
  }
};
