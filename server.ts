/**
 * CargoTrace Root Server Entry Point
 * Mounts the Express backend (from server/src/app.js) with Vite middlewares in development
 * to support the container's single-port (3000) web preview environment.
 */
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app as backendApp } from './server/src/app.js';
import { connectDatabase } from './server/src/config/database.js';
import { initFirebase } from './server/src/config/firebase.js';
import { logger } from './server/src/utils/logger.js';

async function startServer() {
  const port = 3000;
  const app = express();

  // Attempt database and storage initializations
  await connectDatabase();
  initFirebase();

  // Mount the Express backend application
  app.use(backendApp);

  // Mount Vite development middlewares or serve static production build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    logger.info(`CargoTrace container listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start integrated server:', err);
  process.exit(1);
});
