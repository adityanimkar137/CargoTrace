/**
 * CargoTrace Standalone Server Entry Point
 * Starts HTTP listener on configured PORT, initializes services, and registers shutdown handlers.
 */
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initFirebase } from './config/firebase.js';
import { getAIStatus } from './config/ai.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info('Starting CargoTrace Backend Server...', {
    env: env.NODE_ENV,
    port: env.PORT,
    clientOrigin: env.CLIENT_ORIGIN
  });

  // Attempt database connection
  await connectDatabase();

  // Attempt Firebase Admin initialization
  initFirebase();

  // Check AI provider status
  const aiStatus = getAIStatus();
  logger.info('AI Provider Status', aiStatus);

  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(`CargoTrace API listening on http://localhost:${env.PORT}`, {
      healthEndpoint: `http://localhost:${env.PORT}/api/v1/health`
    });
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Process exiting cleanly');
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap failure', { error: err.message, stack: err.stack });
  process.exit(1);
});
