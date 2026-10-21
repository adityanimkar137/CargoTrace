/**
 * CargoTrace Environment Configuration
 * Validates runtime environment variables using Zod.
 */
import { z } from 'zod';
import dotenv from 'dotenv';

import path from 'node:path';

// Load environment variables from both root .env and server/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  MONGODB_URI: z.string().optional().default(''),

  // Session
  SESSION_SECRET: z.string().default('cargotrace-dev-secret-minimum-32-chars-long'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default(''),

  // AI Provider (Gemini / Google Gen AI)
  AI_PROVIDER: z.string().default('google'),
  AI_API_KEY: z.string().optional().default(process.env.GEMINI_API_KEY || ''),
  GEMINI_MODEL: z.string().optional().default(''),
  AI_MODEL: z.string().default(process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export function parseEnv(raw = process.env) {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error('Environment validation failed:', result.error.format());
    throw new Error('Invalid environment configuration');
  }

  const parsed = result.data;

  if (parsed.NODE_ENV === 'production') {
    if (!parsed.MONGODB_URI || parsed.MONGODB_URI.trim() === '') {
      console.error('Production Configuration Error: MONGODB_URI is required when NODE_ENV=production');
      throw new Error('Production Configuration Error: MONGODB_URI is required');
    }
    if (parsed.SESSION_SECRET === 'cargotrace-dev-secret-minimum-32-chars-long') {
      console.warn('Production Warning: Default SESSION_SECRET detected in production environment.');
    }
  }

  return parsed;
}

export const env = parseEnv(process.env);
