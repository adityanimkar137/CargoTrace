/**
 * CargoTrace Firebase Admin & Storage Configuration Module
 * Manages Firebase Admin SDK initialization for server-side evidence file operations.
 */
import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseApp = null;
let initializationError = null;

export function initFirebase() {
  if (firebaseApp) {
    return { initialized: true, appName: firebaseApp.name };
  }

  // Check whether credentials are provided
  const hasServiceAccount = env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;

  if (!hasServiceAccount) {
    logger.warn('Firebase Admin credentials are not set. Evidence file uploads will be unavailable until configured.');
    return {
      initialized: false,
      reason: 'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY is missing'
    };
  }

  try {
    // Handle escaped newlines in environment variable
    const formattedKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const bucketName = env.FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.appspot.com`;

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey
      }),
      storageBucket: bucketName
    });

    logger.info('Firebase Admin initialized successfully', {
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: bucketName
    });

    return { initialized: true, projectId: env.FIREBASE_PROJECT_ID, storageBucket: bucketName };
  } catch (err) {
    initializationError = err.message;
    logger.error('Failed to initialize Firebase Admin SDK', { error: err.message });
    return { initialized: false, error: err.message };
  }
}

export function getFirebaseStatus() {
  const isInit = Boolean(firebaseApp && admin.apps.length > 0);
  return {
    initialized: isInit,
    configured: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
    projectId: env.FIREBASE_PROJECT_ID || null,
    storageBucket: env.FIREBASE_STORAGE_BUCKET || (env.FIREBASE_PROJECT_ID ? `${env.FIREBASE_PROJECT_ID}.appspot.com` : null),
    lastError: initializationError
  };
}

export function getStorageBucket() {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK is not initialized. Evidence storage operations cannot proceed.');
  }
  return admin.storage().bucket();
}
