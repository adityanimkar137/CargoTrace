/**
 * CargoTrace MongoDB Connection Module
 * Handles connection lifecycle, event listeners, and live status reporting.
 */
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { seedInitialDataIfEmpty } from '../utils/seed.js';

let isConnected = false;
let connectionError = null;
let gridFSBucket = null;
let mongodInstance = null;

// Configure Mongoose options
mongoose.set('strictQuery', true);

export async function connectDatabase() {
  let targetUri = env.MONGODB_URI;

  if (!targetUri) {
    if (env.NODE_ENV === 'production') {
      logger.warn('MONGODB_URI is not set. Database operations will be unavailable until configured.');
      return {
        connected: false,
        reason: 'MONGODB_URI environment variable is not configured'
      };
    }

    try {
      if (!mongodInstance) {
        logger.info('Initializing local in-memory MongoDB development engine...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
      }
      targetUri = mongodInstance.getUri();
      logger.info('Local MongoDB server active at ' + targetUri);
    } catch (err) {
      logger.error('Failed to initialize local MongoMemoryServer', { error: err.message });
      return {
        connected: false,
        reason: 'MONGODB_URI not configured and local memory server failed: ' + err.message
      };
    }
  }

  if (isConnected) {
    if (!gridFSBucket && mongoose.connection.readyState === 1) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'evidence'
      });
    }
    return { connected: true, host: mongoose.connection.host };
  }

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000
    });

    isConnected = true;
    connectionError = null;
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'evidence'
    });
    logger.info('Successfully connected to MongoDB', { host: mongoose.connection.host });

    // Seed initial organization, admin, and reviewer accounts
    await seedInitialDataIfEmpty();

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection runtime error', { error: err.message });
      connectionError = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      gridFSBucket = null;
      logger.warn('MongoDB connection lost. Waiting for reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      if (mongoose.connection.db) {
        gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'evidence'
        });
      }
      connectionError = null;
      logger.info('MongoDB reconnected successfully');
    });

    return { connected: true, host: mongoose.connection.host };
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

export function getGridFSBucket() {
  if (!gridFSBucket && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'evidence'
    });
  }
  if (!gridFSBucket) {
    throw new Error('Database is not connected. GridFSBucket cannot be initialized.');
  }
  return gridFSBucket;
}

export function getDatabaseStatus() {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = readyStates[mongoose.connection.readyState] || 'unknown';

  return {
    state,
    connected: mongoose.connection.readyState === 1,
    configured: Boolean(env.MONGODB_URI),
    host: mongoose.connection.host || null,
    databaseName: mongoose.connection.name || null,
    lastError: connectionError
  };
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    gridFSBucket = null;
    logger.info('MongoDB disconnected cleanly');
  }
  if (mongodInstance) {
    try {
      await mongodInstance.stop();
      mongodInstance = null;
      logger.info('Local MongoDB server stopped');
    } catch {}
  }
}
