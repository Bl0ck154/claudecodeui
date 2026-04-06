/**
 * Message normalization utilities.
 * Converts NormalizedMessage[] from the session store into ChatMessage[] for the UI.
 */

import type { NormalizedMessage } from '../../../stores/useSessionStore';
import type { ChatMessage, SubagentChildTool } from '../types/types';
import { decodeHtmlEntities, unescapeWithMathProtection, formatUsageLimitText } from '../utils/chatFormatting';

/**
 * Convert NormalizedMessage[] from the session store into ChatMessage[]
 * that the existing UI components expect.
 *
 * Internal/system content (e.g. <system-reminder>, <command-name>) is already
 * filtered server-side by the Claude adapter (server/providers/utils.js).
 */
export function normalizedToChatMessages(messages: NormalizedMessage[]): ChatMessage[] {
  const converted: ChatMessage[] = [];

  // First pass: collect tool results for attachment
  const toolResultMap = new Map<string, NormalizedMessage>();
  for (const msg of messages) {
    if (msg.kind === 'tool_result' && msg.toolId) {
      toolResultMap.set(msg.toolId, msg);
    }
  }

  for (const msg of messages) {
    switch (msg.kind) {
      case 'text': {
        const content = msg.content || '';
        if (!content.trim()) continue;

        if (msg.role === 'user') {
          // Filter out task notifications and system messages - don't show them in chat
          const taskNotifRegex = /<task-notification>[\s\S]*?<\/task-notification>/;
          const systemReminderRegex = /<system-reminder>[\s\S]*?<\/system-reminder>/;

          // Skip messages that are purely system notifications
          if (taskNotifRegex.test(content) || systemReminderRegex.test(content)) {
            continue;
          }

          converted.push({
            type: 'user',
            content: unescapeWithMathProtection(decodeHtmlEntities(content)),
            timestamp: msg.timestamp,
          });
        } else {
          let text = decodeHtmlEntities(content);
          text = unescapeWithMathProtection(text);
          text = formatUsageLimitText(text);

          // Filter out Claude Code system tags
          text = text.replace(/<attempt_completion>[\s\S]*?<\/attempt_completion>/g, '');
          text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
          text = text.replace(/<task-notification>[\s\S]*?<\/task-notification>/g, '');
          text = text.replace(/<command-name>[\s\S]*?<\/command-name>/g, '');
          text = text.replace(/<function_calls>[\s\S]*?<\/antml:function_calls>/g, '');
          text = text.replace(/<invoke[\s\S]*?<\/antml:invoke>/g, '');

          // Remove agent name and timestamp from responses - more precise patterns
          text = text.replace(/^(Claude|Assistant|Agent)\s*\*\*\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\*\*\.?\s*/i, '');
          text = text.replace(/^Claude[\s\n]+/i, '');

          // Skip very short messages with only special characters or dots
          const trimmedText = text.trim();
          if (trimmedText.length <= 3 && /^[●•\.\s…]+$/.test(trimmedText)) {
            continue;
          }

          // Skip system messages like "Compacting conversation…"
          if (/^[*\s]*Compacting conversation/i.test(trimmedText)) {
            continue;
          }

          converted.push({
            type: 'assistant',
            content: text,
            timestamp: msg.timestamp,
          });
        }
        break;
      }

      case 'tool_use': {
        const tr = msg.toolResult || (msg.toolId ? toolResultMap.get(msg.toolId) : null);
        const isSubagentContainer = msg.toolName === 'Task';

        // Build child tools from subagentTools
        const childTools: SubagentChildTool[] = [];
        if (isSubagentContainer && msg.subagentTools && Array.isArray(msg.subagentTools)) {
          for (const tool of msg.subagentTools as any[]) {
            childTools.push({
              toolId: tool.toolId,
              toolName: tool.toolName,
              toolInput: tool.toolInput,
              toolResult: tool.toolResult || null,
              timestamp: new Date(tool.timestamp || Date.now()),
            });
          }
        }

        const toolResult = tr
          ? {
              content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
              isError: Boolean(tr.isError),
              toolUseResult: (tr as any).toolUseResult,
            }
          : null;

        converted.push({
          type: 'assistant',
          content: '',
          timestamp: msg.timestamp,
          isToolUse: true,
          toolName: msg.toolName,
          toolInput: typeof msg.toolInput === 'string' ? msg.toolInput : JSON.stringify(msg.toolInput ?? '', null, 2),
          toolId: msg.toolId,
          toolResult,
          isSubagentContainer,
          subagentState: isSubagentContainer
            ? {
                childTools,
                currentToolIndex: childTools.length > 0 ? childTools.length - 1 : -1,
                isComplete: Boolean(toolResult),
              }
            : undefined,
        });
        break;
      }

      case 'thinking':
        if (msg.content?.trim()) {
          let text = unescapeWithMathProtection(msg.content);
          // Remove agent name and timestamp from thinking blocks - more precise patterns
          text = text.replace(/^(Claude|Assistant|Agent)\s*\*\*\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\*\*\.?\s*/i, '');
          text = text.replace(/^Claude[\s\n]+/i, '');
          converted.push({
            type: 'assistant',
            content: text,
            timestamp: msg.timestamp,
            isThinking: true,
          });
        }
        break;

      case 'error':
        let errorText = msg.content || 'Unknown error';
        // Remove agent name and timestamp from error messages - more precise patterns
        errorText = errorText.replace(/^(Claude|Assistant|Agent)\s*\*\*\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\*\*\.?\s*/i, '');
        errorText = errorText.replace(/^Claude[\s\n]+/i, '');
        converted.push({
          type: 'error',
          content: errorText,
          timestamp: msg.timestamp,
        });
        break;

      case 'interactive_prompt':
        let promptText = msg.content || '';
        // Remove agent name and timestamp from interactive prompts - more precise patterns
        promptText = promptText.replace(/^(Claude|Assistant|Agent)\s*\*\*\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\*\*\.?\s*/i, '');
        promptText = promptText.replace(/^Claude[\s\n]+/i, '');
        converted.push({
          type: 'assistant',
          content: promptText,
          timestamp: msg.timestamp,
          isInteractivePrompt: true,
        });
        break;

      case 'task_notification':
        converted.push({
          type: 'assistant',
          content: msg.summary || 'Background task update',
          timestamp: msg.timestamp,
          isTaskNotification: true,
          taskStatus: msg.status || 'completed',
        });
        break;

      case 'stream_delta':
        if (msg.content) {
          let streamText = msg.content;
          // Remove agent name and timestamp from streaming content - more precise patterns
          streamText = streamText.replace(/^(Claude|Assistant|Agent)\s*\*\*\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\*\*\.?\s*/i, '');
          streamText = streamText.replace(/^Claude[\s\n]+/i, '');
          converted.push({
            type: 'assistant',
            content: streamText,
            timestamp: msg.timestamp,
            isStreaming: true,
          });
        }
        break;

      // stream_end, complete, status, permission_*, session_created
      // are control events — not rendered as messages
      case 'stream_end':
      case 'complete':
      case 'status':
      case 'permission_request':
      case 'permission_cancelled':
      case 'session_created':
        // Skip — these are handled by useChatRealtimeHandlers
        break;

      // tool_result is handled via attachment to tool_use above
      case 'tool_result':
        break;

      default:
        break;
    }
  }

  return converted;
}
