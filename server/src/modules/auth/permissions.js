/**
 * CargoTrace Role-Based Access Control (RBAC) Permissions Matrix
 * Defines explicit role capabilities enforced on the server.
 */

export const PERMISSIONS = {
  // Organization management
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  ORG_MEMBERS_READ: 'org:members:read',
  ORG_MEMBERS_MANAGE: 'org:members:manage',

  // Investigation & Evidence (Phase 3+)
  SHIPMENT_CREATE: 'shipment:create',
  SHIPMENT_READ: 'shipment:read',
  SHIPMENT_UPDATE: 'shipment:update',
  CUSTODY_MANAGE: 'custody:manage',
  EVIDENCE_UPLOAD: 'evidence:upload',
  EVIDENCE_READ: 'evidence:read',
  INVESTIGATION_RUN: 'investigation:run',
  REPORT_REVIEW: 'report:review',
  REPORT_APPROVE: 'report:approve'
};

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  investigator: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_MEMBERS_READ,
    PERMISSIONS.SHIPMENT_CREATE,
    PERMISSIONS.SHIPMENT_READ,
    PERMISSIONS.SHIPMENT_UPDATE,
    PERMISSIONS.CUSTODY_MANAGE,
    PERMISSIONS.EVIDENCE_UPLOAD,
    PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.INVESTIGATION_RUN
  ],
  reviewer: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_MEMBERS_READ,
    PERMISSIONS.SHIPMENT_READ,
    PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.REPORT_APPROVE
  ],
  viewer: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_MEMBERS_READ,
    PERMISSIONS.SHIPMENT_READ,
    PERMISSIONS.EVIDENCE_READ
  ]
};

export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}
