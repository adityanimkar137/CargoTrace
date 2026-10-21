import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, PERMISSIONS } from './permissions.js';

test('RBAC: admin has all permissions', () => {
  assert.equal(hasPermission('admin', PERMISSIONS.ORG_UPDATE), true);
  assert.equal(hasPermission('admin', PERMISSIONS.ORG_MEMBERS_MANAGE), true);
  assert.equal(hasPermission('admin', PERMISSIONS.REPORT_APPROVE), true);
});

test('RBAC: viewer cannot manage organization members or update org', () => {
  assert.equal(hasPermission('viewer', PERMISSIONS.ORG_MEMBERS_MANAGE), false);
  assert.equal(hasPermission('viewer', PERMISSIONS.ORG_UPDATE), false);
  assert.equal(hasPermission('viewer', PERMISSIONS.ORG_READ), true);
});

test('RBAC: investigator can create shipments but reviewer cannot', () => {
  assert.equal(hasPermission('investigator', PERMISSIONS.SHIPMENT_CREATE), true);
  assert.equal(hasPermission('reviewer', PERMISSIONS.SHIPMENT_CREATE), false);
});

test('RBAC: invalid or empty role returns false', () => {
  assert.equal(hasPermission(null, PERMISSIONS.ORG_READ), false);
  assert.equal(hasPermission('unknown', PERMISSIONS.ORG_READ), false);
});
