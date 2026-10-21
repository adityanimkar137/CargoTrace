/**
 * CargoTrace In-Memory Rate Limiting Middleware
 * Protects endpoints from abuse and brute-force traffic.
 */
import { AppError } from './errorHandler.js';

export function createRateLimiter({ windowMs = 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
  const requests = new Map();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now > record.resetTime) {
        requests.delete(key);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = requests.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requests.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return next(new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
}
