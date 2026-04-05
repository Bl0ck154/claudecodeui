/**
 * Claude CLI Config Loader
 *
 * Reads configuration from ~/.claude/settings.json and ~/.claude/config.json
 * to support custom API URLs and alternative API keys.
 *
 * Priority order:
 * 1. Environment variables (ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL)
 * 2. ~/.claude/settings.json env values
 * 3. ~/.claude/config.json env values
 * 4. Default Anthropic API
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Loads Claude CLI configuration from standard config files
 * @returns {Promise<Object>} Configuration object with apiKey, baseUrl, model
 */
export async function loadClaudeConfig() {
  const config = {
    apiKey: null,
    baseUrl: null,
    model: null,
    authToken: null
  };

  // Priority 1: Check environment variables first
  if (process.env.ANTHROPIC_API_KEY) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (process.env.ANTHROPIC_BASE_URL) {
    config.baseUrl = process.env.ANTHROPIC_BASE_URL;
  }
  if (process.env.ANTHROPIC_MODEL) {
    config.model = process.env.ANTHROPIC_MODEL;
  }
  if (process.env.ANTHROPIC_AUTH_TOKEN) {
    config.authToken = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Priority 2: Load from ~/.claude/settings.json
  try {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    const settingsContent = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);

    if (settings?.env && typeof settings.env === 'object') {
      // Only use settings.json values if not already set by environment
      if (!config.apiKey && settings.env.ANTHROPIC_API_KEY) {
        config.apiKey = settings.env.ANTHROPIC_API_KEY;
      }
      if (!config.baseUrl && settings.env.ANTHROPIC_BASE_URL) {
        config.baseUrl = settings.env.ANTHROPIC_BASE_URL;
      }
      if (!config.model && settings.env.ANTHROPIC_MODEL) {
        config.model = settings.env.ANTHROPIC_MODEL;
      }
      if (!config.authToken && settings.env.ANTHROPIC_AUTH_TOKEN) {
        config.authToken = settings.env.ANTHROPIC_AUTH_TOKEN;
      }
    }
  } catch (error) {
    // Ignore if settings.json doesn't exist or is malformed
  }

  // Priority 3: Load from ~/.claude/config.json (fallback)
  try {
    const configPath = path.join(os.homedir(), '.claude', 'config.json');
    const configContent = await fs.readFile(configPath, 'utf8');
    const configJson = JSON.parse(configContent);

    if (configJson?.env && typeof configJson.env === 'object') {
      // Only use config.json values if not already set
      if (!config.apiKey && configJson.env.ANTHROPIC_API_KEY) {
        config.apiKey = configJson.env.ANTHROPIC_API_KEY;
      }
      if (!config.baseUrl && configJson.env.ANTHROPIC_BASE_URL) {
        config.baseUrl = configJson.env.ANTHROPIC_BASE_URL;
      }
      if (!config.model && configJson.env.ANTHROPIC_MODEL) {
        config.model = configJson.env.ANTHROPIC_MODEL;
      }
      if (!config.authToken && configJson.env.ANTHROPIC_AUTH_TOKEN) {
        config.authToken = configJson.env.ANTHROPIC_AUTH_TOKEN;
      }
    }
  } catch (error) {
    // Ignore if config.json doesn't exist or is malformed
  }

  return config;
}

/**
 * Applies Claude config to SDK options
 * @param {Object} sdkOptions - SDK options object to modify
 * @param {Object} config - Config from loadClaudeConfig()
 */
export function applyClaudeConfigToSDK(sdkOptions, config) {
  // Apply custom base URL if present
  if (config.baseUrl) {
    sdkOptions.apiUrl = config.baseUrl;
  }

  // Apply custom model if present and not already set
  if (config.model && !sdkOptions.model) {
    sdkOptions.model = config.model;
  }

  // Apply API key or auth token
  // Note: The SDK will use these via environment variables that we'll set
  if (config.apiKey && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = config.apiKey;
  }
  if (config.authToken && !process.env.ANTHROPIC_AUTH_TOKEN) {
    process.env.ANTHROPIC_AUTH_TOKEN = config.authToken;
  }
}
