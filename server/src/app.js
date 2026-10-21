/**
 * CargoTrace Express Application Setup
 * Configures middleware, security, CORS, routes, health monitoring, and error handling.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import { getFirebaseStatus } from './config/firebase.js';
import { getAIStatus } from './config/ai.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import authRouter from './modules/auth/routes.js';
import orgRouter from './modules/organizations/routes.js';
import shipmentRouter from './modules/shipments/routes.js';
import custodyRouter from './modules/custody/routes.js';
import inspectionRouter from './modules/inspections/routes.js';
import incidentRouter from './modules/incidents/routes.js';
import evidenceRouter from './modules/evidence/routes.js';
import investigationRouter from './modules/investigation/routes.js';
import relationshipRouter from './modules/relationships/routes.js';
import { custodyController } from './modules/custody/controller.js';
import { inspectionController } from './modules/inspections/controller.js';
import { incidentController } from './modules/incidents/controller.js';
import { evidenceController } from './modules/evidence/controller.js';
import { investigationController } from './modules/investigation/controller.js';
import { authenticate } from './middleware/authenticate.js';
import { requirePermission } from './middleware/authorize.js';
import { PERMISSIONS } from './modules/auth/permissions.js';

export function createApp() {
  const app = express();

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Request ID tracking
  app.use(requestIdMiddleware);

  // CORS configuration
  const allowedOrigins = [
    env.CLIENT_ORIGIN,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
        return callback(null, true);
      }
      if (env.NODE_ENV === 'production') {
        return callback(new Error('Not allowed by CORS'), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  }));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration
      });
    });
    next();
  });

  // Health Check Handler
  const healthHandler = (req, res) => {
    const dbStatus = getDatabaseStatus();
    const fbStatus = getFirebaseStatus();
    const aiStatus = getAIStatus();

    // Determine overall system health
    let overallStatus = 'healthy';
    if (!dbStatus.connected) {
      overallStatus = 'degraded'; // Operational foundation up, but database is disconnected/unconfigured
    }

    res.json({
      status: overallStatus,
      service: 'cargotrace-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      subsystems: {
        database: {
          status: dbStatus.connected ? 'connected' : (dbStatus.configured ? 'error' : 'unconfigured'),
          state: dbStatus.state,
          configured: dbStatus.configured,
          host: dbStatus.host,
          databaseName: dbStatus.databaseName,
          lastError: dbStatus.lastError
        },
        storage: {
          status: fbStatus.initialized ? 'connected' : (fbStatus.configured ? 'error' : 'unconfigured'),
          configured: fbStatus.configured,
          projectId: fbStatus.projectId,
          storageBucket: fbStatus.storageBucket,
          lastError: fbStatus.lastError
        },
        ai: {
          status: aiStatus.configured ? 'ready' : 'unconfigured',
          provider: aiStatus.provider,
          model: aiStatus.model,
          message: aiStatus.message
        }
      }
    });
  };

  // Mount Health endpoints on both root and /api/v1
  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // Root API welcome / metadata
  app.get('/api/v1', (req, res) => {
    res.json({
      name: 'CargoTrace API',
      version: '1.0.0',
      phase: 'Phase 5 - Investigation Timeline, Anomaly Detection & Evidence Gap Analysis',
      documentation: 'REST API v1 endpoints under /api/v1',
      healthUrl: '/api/v1/health'
    });
  });

  // Mount Feature Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/organizations', orgRouter);
  app.use('/api/v1/shipments', shipmentRouter);

  // Mount Shipment-Scoped Phase 4 Routers
  app.use('/api/v1/shipments/:shipmentId/custody-events', custodyRouter);
  app.use('/api/v1/shipments/:shipmentId/inspections', inspectionRouter);
  app.use('/api/v1/shipments/:shipmentId/incidents', incidentRouter);
  app.use('/api/v1/shipments/:shipmentId/evidence', evidenceRouter);
  app.use('/api/v1/shipments/:shipmentId/investigation', investigationRouter);
  app.use('/api/v1/shipments/:shipmentId/relationships', relationshipRouter);
  app.get('/api/v1/shipments/:shipmentId/anomalies', authenticate, requirePermission(PERMISSIONS.SHIPMENT_READ), investigationController.getAnomalies);

  // Direct Resource Lookup Endpoints
  app.get('/api/v1/custody-events/:id', authenticate, requirePermission(PERMISSIONS.SHIPMENT_READ), custodyController.getById);
  app.patch('/api/v1/custody-events/:id/acknowledge', authenticate, requirePermission(PERMISSIONS.CUSTODY_MANAGE), custodyController.acknowledge);

  app.get('/api/v1/inspections/:id', authenticate, requirePermission(PERMISSIONS.SHIPMENT_READ), inspectionController.getById);

  app.get('/api/v1/incidents/:id', authenticate, requirePermission(PERMISSIONS.SHIPMENT_READ), incidentController.getById);
  app.patch('/api/v1/incidents/:id', authenticate, requirePermission(PERMISSIONS.SHIPMENT_UPDATE), incidentController.update);

  app.get('/api/v1/evidence/:id', authenticate, requirePermission(PERMISSIONS.EVIDENCE_READ), evidenceController.getById);
  app.get('/api/v1/evidence/:id/file', authenticate, requirePermission(PERMISSIONS.EVIDENCE_READ), evidenceController.streamFile);

  // 404 handler for unhandled API routes
  app.use('/api', notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
