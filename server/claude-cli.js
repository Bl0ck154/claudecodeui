import { spawn } from 'child_process';
import crossSpawn from 'cross-spawn';
import { notifyRunFailed, notifyRunStopped } from './services/notification-orchestrator.js';
import { claudeAdapter } from './providers/claude/adapter.js';
import { createNormalizedMessage } from './providers/types.js';

// Use cross-spawn on Windows for better command execution
const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;

let activeClaudeProcesses = new Map();

async function spawnClaude(command, options = {}, ws) {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, model, sessionSummary } = options;
    let capturedSessionId = sessionId;
    let sessionCreatedSent = false;
    let settled = false;

    // Build Claude CLI command
    const baseArgs = [];

    // Resume existing session or create new
    if (sessionId) {
      baseArgs.push('--resume=' + sessionId);
    }

    if (command && command.trim()) {
      baseArgs.push('-p', command);

      if (!sessionId && model) {
        baseArgs.push('--model', model);
      }

      baseArgs.push('--output-format', 'stream-json');
    }

    // Use cwd (actual project directory)
    const workingDir = cwd || projectPath || process.cwd();
    const processKey = capturedSessionId || Date.now().toString();

    const settleOnce = (callback) => {
      if (settled) return;
      settled = true;
      callback();
    };

    const runClaudeProcess = (args) => {
      let stdoutLineBuffer = '';
      let terminalNotificationSent = false;

      const notifyTerminalState = ({ code = null, error = null } = {}) => {
        if (terminalNotificationSent) return;
        terminalNotificationSent = true;

        const finalSessionId = capturedSessionId || sessionId || processKey;
        if (code === 0 && !error) {
          notifyRunStopped({
            userId: ws?.userId || null,
            provider: 'claude',
            sessionId: finalSessionId,
            sessionName: sessionSummary,
            stopReason: 'completed'
          });
          return;
        }

        notifyRunFailed({
          userId: ws?.userId || null,
          provider: 'claude',
          sessionId: finalSessionId,
          sessionName: sessionSummary,
          error: error || `Claude CLI exited with code ${code}`
        });
      };

      console.log('Spawning Claude CLI:', 'claude', args.join(' '));
      console.log('Working directory:', workingDir);

      const claudeProcess = spawnFunction('claude', args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      activeClaudeProcesses.set(processKey, claudeProcess);

      const processClaudeOutputLine = (line) => {
        if (!line || !line.trim()) return;

        try {
          const parsed = JSON.parse(line);

          // Extract session ID from session_created event
          if (parsed.type === 'session_created' && parsed.session_id && !capturedSessionId) {
            capturedSessionId = parsed.session_id;
            sessionCreatedSent = true;
          }

          // Convert to normalized message
          const normalized = claudeAdapter(parsed, capturedSessionId || sessionId);

          if (normalized) {
            ws.send(normalized);
          }
        } catch (e) {
          console.error('[Claude CLI] Parse error:', e.message);
        }
      };

      claudeProcess.stdout.on('data', (data) => {
        stdoutLineBuffer += data.toString();
        const lines = stdoutLineBuffer.split('\n');
        stdoutLineBuffer = lines.pop() || '';

        for (const line of lines) {
          processClaudeOutputLine(line);
        }
      });

      claudeProcess.stderr.on('data', (data) => {
        console.error('[Claude CLI stderr]:', data.toString());
      });

      claudeProcess.on('error', (error) => {
        console.error('[Claude CLI] Process error:', error);
        notifyTerminalState({ error: error.message });
        settleOnce(() => reject(error));
      });

      claudeProcess.on('exit', (code, signal) => {
        console.log(`[Claude CLI] Process exited with code ${code}, signal ${signal}`);
        activeClaudeProcesses.delete(processKey);

        // Flush remaining buffer
        if (stdoutLineBuffer.trim()) {
          processClaudeOutputLine(stdoutLineBuffer);
        }

        notifyTerminalState({ code });
        settleOnce(() => {
          if (code === 0) {
            resolve({ sessionId: capturedSessionId });
          } else {
            reject(new Error(`Claude CLI exited with code ${code}`));
          }
        });
      });
    };

    runClaudeProcess(baseArgs);
  });
}

export function abortClaudeSession(sessionId) {
  const process = activeClaudeProcesses.get(sessionId);
  if (process) {
    process.kill('SIGTERM');
    activeClaudeProcesses.delete(sessionId);
    return true;
  }
  return false;
}

export function isClaudeSessionActive(sessionId) {
  return activeClaudeProcesses.has(sessionId);
}

export function getActiveClaudeSessions() {
  return Array.from(activeClaudeProcesses.keys());
}

export { spawnClaude };
