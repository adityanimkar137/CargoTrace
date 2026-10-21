/**
 * CargoTrace Authentication Routes
 */
import { Router } from 'express';
import { authController } from './controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// Rate limit login/register attempts: 20 per 15 minutes
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please wait before trying again.'
});

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
