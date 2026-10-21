/**
 * CargoTrace Centralized Error Handling Middleware
 * Ensures predictable error response format and prevents leaking sensitive stack traces in production.
 */
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res, next) {
  const err = new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = statusCode >= 500 && env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred.'
    : err.message || 'An unexpected error occurred';

  const logPayload = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    error: err.message,
    // Only attach stack trace for actual 500 internal server exceptions
    stack: statusCode >= 500 && env.NODE_ENV !== 'production' ? err.stack : undefined
  };

  // Log level hierarchy:
  // - 500+ Internal Errors -> logger.error
  // - 4xx Client Operational Errors (403, 404, 409, 503) -> logger.warn
  // - Expected 401 Unauthenticated checks -> logger.info (clean log without stack trace)
  if (statusCode >= 500 && code !== 'DATABASE_UNAVAILABLE') {
    logger.error('API Internal Server Error', logPayload);
  } else if (statusCode === 401) {
    logger.info('API Authentication Notice', logPayload);
  } else {
    logger.warn('API Operational Notice', logPayload);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: err.details || null,
      requestId: req.id || null,
      timestamp: new Date().toISOString()
    }
  });
}
