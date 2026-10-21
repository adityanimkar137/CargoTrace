/**
 * CargoTrace Request Validation Middleware
 * Uses Zod schemas to strictly validate query, params, and body payloads.
 */
import { AppError } from './errorHandler.js';

export function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const formatted = err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        return next(new AppError('Invalid request payload', 400, 'VALIDATION_ERROR', formatted));
      }
      next(err);
    }
  };
}
