/**
 * CargoTrace Structured Logger
 * Provides standardized JSON logging with severity levels and secret redaction.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'api_key',
  'private_key',
  'credentials'
];

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive && typeof value === 'string') {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitize(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export class Logger {
  constructor(service = 'cargotrace-api', minLevel = 'info') {
    this.service = service;
    this.minLevel = LOG_LEVELS[minLevel.toLowerCase()] ?? LOG_LEVELS.info;
  }

  log(level, message, context = {}) {
    const numericLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
    if (numericLevel < this.minLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.service,
      message,
      ...sanitize(context)
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(msg, ctx) { this.log('debug', msg, ctx); }
  info(msg, ctx) { this.log('info', msg, ctx); }
  warn(msg, ctx) { this.log('warn', msg, ctx); }
  error(msg, ctx) { this.log('error', msg, ctx); }
}

export const logger = new Logger('cargotrace-server', process.env.LOG_LEVEL || 'info');
