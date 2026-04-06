/**
 * Claude API Integration (Direct HTTP)
 *
 * Makes direct HTTP requests to Anthropic API (via OmniRoute) instead of using SDK.
 * This avoids the subprocess spawning issue with the SDK.
 */

import fetch from 'node-fetch';
import { loadClaudeConfig } from './utils/claude-config-loader.js';

const activeSessions = new Map();

/**
 * Query Claude API directly via HTTP
 */
export async function queryClaudeAPI(command, options, writer) {
  const sessionId = options?.sessionId || `session-${Date.now()}`;

  try {
    // Load config from ~/.claude/settings.json
    const config = await loadClaudeConfig();
    const apiUrl = config.baseUrl || 'https://api.anthropic.com';
    const apiKey = config.authToken || config.apiKey || process.env.ANTHROPIC_API_KEY;

    // Ignore SDK format models (sonnet, opus, haiku) and use config model instead
    const uiModel = options?.model;
    const isSDKFormat = uiModel && ['sonnet', 'opus', 'haiku', 'opusplan', 'sonnet[1m]'].includes(uiModel.toLowerCase());
    const model = (isSDKFormat || !uiModel) ? (config.model || 'kr/claude-sonnet-4.5') : uiModel;

    if (!apiKey) {
      throw new Error('No API key found. Set ANTHROPIC_AUTH_TOKEN in ~/.claude/settings.json');
    }

    console.log('[Claude API] Using:', { apiUrl, model, uiModel, isSDKFormat });

    // Send session_created if new session
    if (!options?.sessionId) {
      writer.send({
        kind: 'session_created',
        newSessionId: sessionId,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });
    }

    // Build messages array
    const messages = [];
    if (command && command.trim()) {
      messages.push({
        role: 'user',
        content: command
      });
    }

    // Make API request
    const response = await fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    // Send status message to show "thinking"
    writer.send({
      kind: 'status',
      sessionId,
      status: {
        text: 'Thinking...',
        tokens: 0,
        can_interrupt: true
      },
      timestamp: new Date().toISOString()
    });

    // Stream response using async iterator (Node.js native)
    let buffer = '';
    let hasReceivedData = false;

    try {
      for await (const chunk of response.body) {
        hasReceivedData = true;
        const chunkStr = chunk.toString();
        console.log('[Claude API] Received chunk:', chunkStr.substring(0, 200));

        buffer += chunkStr;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          console.log('[Claude API] Processing line:', line.substring(0, 100));

          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            console.log('[Claude API] Event type:', event.type);

            // Send to client
            if (event.type === 'content_block_delta' && event.delta?.text) {
              console.log('[Claude API] Sending text:', event.delta.text);
              writer.send({
                kind: 'stream_delta',
                content: event.delta.text,
                sessionId,
                timestamp: new Date().toISOString()
              });
            }

            if (event.type === 'message_stop') {
              writer.send({
                kind: 'stream_end',
                sessionId,
                timestamp: new Date().toISOString()
              });

              writer.send({
                kind: 'complete',
                sessionId,
                timestamp: new Date().toISOString()
              });
            }
          } catch (e) {
            console.error('[Claude API] Parse error:', e.message, 'Line:', line);
          }
        }
      }

      console.log('[Claude API] Stream ended. Received data:', hasReceivedData);
    } catch (error) {
      console.error('[Claude API] Stream error:', error);
      writer.send({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Claude API] Error:', error);
    writer.write(JSON.stringify({
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }) + '\n');
  }
}

export function abortClaudeAPISession(sessionId) {
  // TODO: Implement abort
  console.log('[Claude API] Abort session:', sessionId);
}

export function isClaudeAPISessionActive(sessionId) {
  return activeSessions.has(sessionId);
}

export function getActiveClaudeAPISessions() {
  return Array.from(activeSessions.keys());
}
