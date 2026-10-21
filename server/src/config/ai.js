/**
 * CargoTrace AI Provider Configuration Module
 * Manages official Google Gen AI SDK initialization for investigation analysis.
 */
import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let aiClient = null;

export function getAIClient() {
  const apiKey = env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      logger.info('Google Gen AI client initialized', { provider: env.AI_PROVIDER, model: env.AI_MODEL });
    } catch (err) {
      logger.error('Failed to instantiate Google Gen AI client', { error: err.message });
      return null;
    }
  }

  return aiClient;
}

export function getAIStatus() {
  const apiKey = env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '');

  return {
    provider: env.AI_PROVIDER,
    configured: isConfigured,
    model: env.AI_MODEL,
    message: isConfigured
      ? `AI provider '${env.AI_PROVIDER}' ready with model '${env.AI_MODEL}'`
      : 'AI API key not configured. Analysis will remain disabled until configured.'
  };
}
