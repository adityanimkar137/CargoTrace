import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from './env.js';
import { requestIdMiddleware } from '../middleware/requestId.js';

test('parseEnv: sets default port to 5000 when PORT is not provided', () => {
  const result = parseEnv({});
  assert.equal(result.PORT, 5000);
  assert.equal(result.NODE_ENV, 'development');
  assert.equal(result.CLIENT_ORIGIN, 'http://localhost:5173');
});

test('parseEnv: coerces custom port number', () => {
  const result = parseEnv({ PORT: '5050' });
  assert.equal(result.PORT, 5050);
});

test('requestIdMiddleware: assigns new UUID if x-request-id is absent', () => {
  const req = { headers: {} };
  let headerSet = null;
  const res = {
    setHeader: (name, value) => {
      if (name === 'X-Request-Id') headerSet = value;
    }
  };
  let nextCalled = false;

  requestIdMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(req.id, 'req.id should be assigned');
  assert.equal(typeof req.id, 'string');
  assert.equal(headerSet, req.id);
});

test('requestIdMiddleware: preserves existing valid x-request-id header', () => {
  const existingId = 'custom-trace-uuid-12345';
  const req = { headers: { 'x-request-id': existingId } };
  let headerSet = null;
  const res = {
    setHeader: (name, value) => {
      if (name === 'X-Request-Id') headerSet = value;
    }
  };

  requestIdMiddleware(req, res, () => {});

  assert.equal(req.id, existingId);
  assert.equal(headerSet, existingId);
});
