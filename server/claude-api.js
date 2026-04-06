/**
 * Claude API Integration (Direct HTTP)
 *
 * Makes direct HTTP requests to Anthropic API (via OmniRoute) instead of using SDK.
 * This avoids the subprocess spawning issue with the SDK.
 */

import fetch from 'node-fetch';
import { loadClaudeConfig } from './utils/claude-config-loader.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getSessionMessages } from './projects.js';

const activeSessions = new Map();

/**
 * Save message to .jsonl file
 */
async function saveMessageToFile(sessionId, projectPath, messageData) {
  try {
    const projectName = projectPath.replace(/[/\\:]/g, '-').replace(/^-+/, '');
    const projectDir = path.join(os.homedir(), '.claude', 'projects', projectName);
    await fs.mkdir(projectDir, { recursive: true });

    const sessionFile = path.join(projectDir, `${sessionId}.jsonl`);
    const line = JSON.stringify(messageData) + '\n';
    await fs.appendFile(sessionFile, line, 'utf8');
  } catch (error) {
    console.error('[Claude API] Error saving message:', error);
  }
}

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

    // Load conversation history if resuming existing session
    if (options?.sessionId && options?.projectPath) {
      try {
        const projectName = options.projectPath.replace(/[/\\:]/g, '-').replace(/^-+/, '');
        const history = await getSessionMessages(projectName, sessionId);

        console.log('[Claude API] Loaded history:', history.length, 'entries');

        // Convert history to API format
        for (const entry of history) {
          if (entry.message?.role === 'user') {
            messages.push({
              role: 'user',
              content: entry.message.content
            });
          } else if (entry.message?.role === 'assistant') {
            messages.push({
              role: 'assistant',
              content: entry.message.content
            });
          }
        }
      } catch (error) {
        console.warn('[Claude API] Failed to load history:', error.message);
      }
    }

    let userMessageId = null;
    if (command && command.trim()) {
      messages.push({
        role: 'user',
        content: command
      });

      // Save user message
      userMessageId = uuidv4();
      await saveMessageToFile(sessionId, options?.projectPath || process.cwd(), {
        type: 'user',
        uuid: userMessageId,
        message: {
          role: 'user',
          content: command
        },
        sessionId,
        timestamp: new Date().toISOString(),
        cwd: options?.projectPath || process.cwd(),
        parentUuid: null,
        isSidechain: false
      });
    }

    // Validate messages array is not empty
    if (messages.length === 0) {
      console.warn('[Claude API] No messages to send');
      writer.send({
        kind: 'complete',
        sessionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('[Claude API] Sending', messages.length, 'messages to API');

    // Build system prompt with working directory context
    const workingDir = options?.projectPath || process.cwd();
    const systemPrompt = `You are Claude, a helpful AI assistant.

Current working directory: ${workingDir}

You have access to the files and code in this directory. When the user asks about the project, refer to files in this location.`;

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
        system: systemPrompt,
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
    let accumulatedText = '';
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let incompleteBytes = Buffer.alloc(0);

    // Batch deltas to avoid sending incomplete UTF-8 sequences
    let deltaBuffer = '';
    let deltaTimer = null;
    const flushDeltas = () => {
      if (deltaBuffer && deltaBuffer.length > 0) {
        writer.send({
          kind: 'stream_delta',
          content: deltaBuffer,
          sessionId,
          timestamp: new Date().toISOString()
        });
        deltaBuffer = '';
      }
      deltaTimer = null;
    };

    try {
      for await (const chunk of response.body) {
        hasReceivedData = true;

        // Concatenate with any incomplete bytes from previous chunk
        const fullChunk = Buffer.concat([incompleteBytes, Buffer.from(chunk)]);

        // Try to decode, keeping incomplete UTF-8 sequences for next iteration
        let chunkStr = '';
        let validBytes = fullChunk.length;

        // Check if last 1-3 bytes might be incomplete UTF-8 sequence
        for (let i = Math.max(0, fullChunk.length - 3); i < fullChunk.length; i++) {
          const byte = fullChunk[i];
          // Check if this starts a multi-byte UTF-8 sequence
          if ((byte & 0x80) !== 0) {
            // Count expected bytes in this sequence
            let expectedBytes = 0;
            if ((byte & 0xE0) === 0xC0) expectedBytes = 2;
            else if ((byte & 0xF0) === 0xE0) expectedBytes = 3;
            else if ((byte & 0xF8) === 0xF0) expectedBytes = 4;

            const remainingBytes = fullChunk.length - i;
            if (remainingBytes < expectedBytes) {
              // Incomplete sequence - save for next chunk
              validBytes = i;
              incompleteBytes = fullChunk.slice(i);
              break;
            }
          }
        }

        if (validBytes === fullChunk.length) {
          incompleteBytes = Buffer.alloc(0);
        }

        chunkStr = decoder.decode(fullChunk.slice(0, validBytes));
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
              accumulatedText += event.delta.text;

              // Batch deltas with timer to avoid incomplete UTF-8
              deltaBuffer += event.delta.text;
              if (deltaTimer) {
                clearTimeout(deltaTimer);
              }
              deltaTimer = setTimeout(flushDeltas, 50);
            }

            if (event.type === 'message_stop') {
              // Flush any remaining deltas
              if (deltaTimer) {
                clearTimeout(deltaTimer);
                flushDeltas();
              }

              writer.send({
                kind: 'stream_end',
                sessionId,
                timestamp: new Date().toISOString()
              });

              // Save assistant message
              if (accumulatedText) {
                const assistantMessageId = uuidv4();
                await saveMessageToFile(sessionId, options?.projectPath || process.cwd(), {
                  type: 'assistant',
                  uuid: assistantMessageId,
                  message: {
                    role: 'assistant',
                    content: [{
                      type: 'text',
                      text: accumulatedText
                    }],
                    id: assistantMessageId,
                    model: model,
                    stop_reason: 'end_turn',
                    type: 'message',
                    usage: {
                      input_tokens: 0,
                      output_tokens: 0
                    }
                  },
                  sessionId,
                  timestamp: new Date().toISOString(),
                  cwd: options?.projectPath || process.cwd(),
                  parentUuid: userMessageId,
                  isSidechain: false
                });
              }

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
