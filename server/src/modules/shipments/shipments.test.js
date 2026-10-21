import test from 'node:test';
import assert from 'node:assert/strict';
import { Shipment } from './model.js';
import { createShipmentSchema, updateShipmentSchema, listShipmentQuerySchema } from './validation.js';

test('Shipment Model: generateReference produces CT-YYYYMM-XXXX format', () => {
  const ref = Shipment.generateReference();
  assert.ok(/^CT-\d{6}-[A-Z0-9]{4}$/.test(ref), `Reference ${ref} should match CT-YYYYMM-XXXX pattern`);
});

test('createShipmentSchema: validates valid shipment payload', () => {
  const payload = {
    description: 'High-Value Electronics Container',
    origin: 'Port of Los Angeles, CA',
    destination: 'Distribution Hub Chicago, IL',
    carrier: 'Maersk Logistics',
    trackingReference: 'TRK-99201-US',
    status: 'REGISTERED',
    expectedArrival: '2026-11-05',
    notes: 'Fragile cargo, temperature sensitive'
  };

  const parsed = createShipmentSchema.parse(payload);
  assert.equal(parsed.description, payload.description);
  assert.equal(parsed.origin, payload.origin);
  assert.equal(parsed.destination, payload.destination);
  assert.equal(parsed.status, 'REGISTERED');
  assert.ok(parsed.expectedArrival instanceof Date);
});

test('createShipmentSchema: throws validation error when description is missing', () => {
  const payload = {
    origin: 'Port of Seattle',
    destination: 'Denver Logistics Center'
  };

  assert.throws(() => {
    createShipmentSchema.parse(payload);
  });
});

test('createShipmentSchema: throws validation error for invalid status', () => {
  const payload = {
    description: 'Cargo Box',
    origin: 'Seattle',
    destination: 'Denver',
    status: 'INVALID_STATUS'
  };

  assert.throws(() => {
    createShipmentSchema.parse(payload);
  });
});

test('updateShipmentSchema: permits partial updates and sanitizes notes', () => {
  const payload = {
    status: 'IN_TRANSIT',
    notes: 'Arrived at intermediate hub in Kansas'
  };

  const parsed = updateShipmentSchema.parse(payload);
  assert.equal(parsed.status, 'IN_TRANSIT');
  assert.equal(parsed.notes, payload.notes);
});

test('listShipmentQuerySchema: sets default pagination and sort options', () => {
  const parsed = listShipmentQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.sortBy, 'createdAt');
  assert.equal(parsed.sortOrder, 'desc');
});
