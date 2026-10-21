/**
 * CargoTrace Request ID Middleware
 * Assigns or propagates a unique request identifier for distributed tracing and audit logs.
 */
import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.length <= 64
    ? incomingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
