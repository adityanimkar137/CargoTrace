import test from 'node:test';
import assert from 'node:assert/strict';
import { createCustodyEventSchema } from './custody/validation.js';
import { createInspectionSchema } from './inspections/validation.js';
import { createIncidentSchema, updateIncidentSchema } from './incidents/validation.js';
import { DamageIncident } from './incidents/model.js';
import { Evidence } from './evidence/model.js';

test('Incident Model: generateReference produces INC-YYYYMM-XXXX format', () => {
  const ref = DamageIncident.generateReference();
  assert.ok(/^INC-\d{6}-[A-Z0-9]{4}$/.test(ref), `Incident ref ${ref} should match pattern`);
});

test('Evidence Model: generateReference produces EVD-YYYYMM-XXXX format', () => {
  const ref = Evidence.generateReference();
  assert.ok(/^EVD-\d{6}-[A-Z0-9]{4}$/.test(ref), `Evidence ref ${ref} should match pattern`);
});

test('createCustodyEventSchema: validates valid handover payload', () => {
  const payload = {
    eventType: 'CUSTODY_HANDOVER',
    fromParty: 'Yamato Logistics Inc.',
    toParty: 'Pacific Fleet Driver #402',
    location: 'Yokohama Terminal B',
    occurredAt: '2026-10-15T10:30:00.000Z',
    notes: 'Container seal intact upon receipt'
  };

  const parsed = createCustodyEventSchema.parse(payload);
  assert.equal(parsed.eventType, 'CUSTODY_HANDOVER');
  assert.equal(parsed.fromParty, payload.fromParty);
  assert.ok(parsed.occurredAt instanceof Date);
});

test('createInspectionSchema: validates cargo condition inspection', () => {
  const payload = {
    inspectionType: 'HUB',
    location: 'Oakland Freight Center',
    inspectedAt: '2026-10-18T14:00:00.000Z',
    overallCondition: 'MINOR_DAMAGE',
    packagingCondition: 'MINOR_DAMAGE',
    sealCondition: 'INTACT',
    visibleDamage: true,
    damageDescription: 'Dented side panel on outer crate'
  };

  const parsed = createInspectionSchema.parse(payload);
  assert.equal(parsed.inspectionType, 'HUB');
  assert.equal(parsed.overallCondition, 'MINOR_DAMAGE');
  assert.equal(parsed.visibleDamage, true);
});

test('createIncidentSchema: validates damage report payload', () => {
  const payload = {
    title: 'Water Intrusion in Upper Container Corner',
    description: 'Moisture accumulation observed near roof seal during unloading.',
    damageType: 'WATER_DAMAGE',
    severity: 'MODERATE',
    location: 'Long Beach Terminal 4',
    discoveredAt: '2026-10-19T08:00:00.000Z',
    status: 'OPEN'
  };

  const parsed = createIncidentSchema.parse(payload);
  assert.equal(parsed.title, payload.title);
  assert.equal(parsed.damageType, 'WATER_DAMAGE');
  assert.equal(parsed.severity, 'MODERATE');
});

test('updateIncidentSchema: permits status update and resolution notes', () => {
  const payload = {
    status: 'RESOLVED',
    resolutionNotes: 'Inspection confirmed water intrusion occurred prior to port receipt. Claim file logged.'
  };

  const parsed = updateIncidentSchema.parse(payload);
  assert.equal(parsed.status, 'RESOLVED');
  assert.equal(parsed.resolutionNotes, payload.resolutionNotes);
});
