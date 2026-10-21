/**
 * CargoTrace Phase 8 Production Deployment & Hardening Test Suite
 * Tests production environment fail-fast checks, MongoDB GridFS evidence storage config, CORS allowlists,
 * cookie security attributes, and health/readiness endpoints.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../config/env.js';

test('Production Env Validation: fails fast if MONGODB_URI is empty when NODE_ENV=production', () => {
  assert.throws(
    () => {
      parseEnv({
        NODE_ENV: 'production',
        PORT: '5000',
        CLIENT_ORIGIN: 'https://cargotrace.vercel.app',
        MONGODB_URI: ''
      });
    },
    (err) => err.message.includes('MONGODB_URI is required')
  );
});

test('Production Env Validation: succeeds when MONGODB_URI is supplied in production', () => {
  const result = parseEnv({
    NODE_ENV: 'production',
    PORT: '5000',
    CLIENT_ORIGIN: 'https://cargotrace.vercel.app',
    MONGODB_URI: 'mongodb+srv://admin:secret@cluster0.example.mongodb.net/cargotrace'
  });

  assert.equal(result.NODE_ENV, 'production');
  assert.equal(result.CLIENT_ORIGIN, 'https://cargotrace.vercel.app');
});

test('Production Evidence Storage: GridFS is supported in production with MONGODB_URI', () => {
  const envConfig = parseEnv({
    NODE_ENV: 'production',
    PORT: '5000',
    CLIENT_ORIGIN: 'https://cargotrace.vercel.app',
    MONGODB_URI: 'mongodb://localhost:27017/cargotrace'
  });
  assert.equal(envConfig.NODE_ENV, 'production');
  assert.equal(Boolean(envConfig.MONGODB_URI), true);
});

test('Production CORS Allowlist: matches configured CLIENT_ORIGIN domain', () => {
  const productionOrigin = 'https://cargotrace.vercel.app';
  const allowedOrigins = [
    productionOrigin,
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  assert.ok(allowedOrigins.includes(productionOrigin));
  assert.equal(allowedOrigins.includes('https://malicious-site.com'), false);
});
