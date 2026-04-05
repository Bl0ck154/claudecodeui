import React from 'react';
import type { SubagentChildTool } from '../../types/types';
import { CollapsibleSection } from './CollapsibleSection';

interface SubagentContainerProps {
  toolInput: unknown;
  toolResult?: { content?: unknown; isError?: boolean } | null;
  subagentState: {
    childTools: SubagentChildTool[];
    currentToolIndex: number;
    isComplete: boolean;
  };
}

const getCompactToolDisplay = (toolName: string, toolInput: unknown): string => {
  const input = typeof toolInput === 'string' ? (() => {
    try { return JSON.parse(toolInput); } catch { return {}; }
  })() : (toolInput || {});

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'ApplyPatch':
      return input.file_path?.split('/').pop() || input.file_path || '';
    case 'Grep':
    case 'Glob':
      return input.pattern || '';
    case 'Bash':
      const cmd = input.command || '';
      return cmd.length > 40 ? `${cmd.slice(0, 40)}...` : cmd;
    case 'Task':
      return input.description || input.subagent_type || '';
    case 'WebFetch':
    case 'WebSearch':
      return input.url || input.query || '';
    default:
      return '';
  }
};

export const SubagentContainer: React.FC<SubagentContainerProps> = ({
  toolInput,
  toolResult,
  subagentState,
}) => {
  const parsedInput = typeof toolInput === 'string' ? (() => {
    try { return JSON.parse(toolInput); } catch { return {}; }
  })() : (toolInput || {});

  const subagentType = parsedInput?.subagent_type || 'Agent';
  const description = parsedInput?.description || 'Running task';
  const prompt = parsedInput?.prompt || '';
  const { childTools, currentToolIndex, isComplete } = subagentState;
  const currentTool = currentToolIndex >= 0 ? childTools[currentToolIndex] : null;

  const title = `Subagent / ${subagentType}: ${description}`;

  return (
    <div className="my-1 border-l-2 border-l-purple-500 py-0.5 pl-3 dark:border-l-purple-400">
      <CollapsibleSection
        title={title}
        toolName="Task"
        open={true}
      >
        {/* Prompt/request to the subagent */}
        {prompt && (
          <div className="mb-2 line-clamp-4 whitespace-pre-wrap break-words text-xs text-gray-600 dark:text-gray-400">
            {prompt}
          </div>
        )}

        {/* Current tool indicator (while running) */}
        {currentTool && !isComplete && (
          <div className="mt-2 rounded-md border border-purple-200 bg-purple-50 p-2.5 dark:border-purple-800 dark:bg-purple-950/30">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500 dark:bg-purple-400" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-purple-700 dark:text-purple-300">Running:</span>
                  <span className="font-semibold text-purple-900 dark:text-purple-100">{currentTool.toolName}</span>
                </div>
                {getCompactToolDisplay(currentTool.toolName, currentTool.toolInput) && (
                  <div className="truncate font-mono text-xs text-purple-600 dark:text-purple-400">
                    {getCompactToolDisplay(currentTool.toolName, currentTool.toolInput)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion status */}
        {isComplete && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Completed ({childTools.length} {childTools.length === 1 ? 'tool' : 'tools'})</span>
          </div>
        )}

        {/* Tool history (collapsed) */}
        {childTools.length > 0 && (
          <details className="group/history mt-2" open={isComplete}>
            <summary className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              <svg
                className="h-3 w-3 flex-shrink-0 transition-transform duration-150 group-open/history:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Tool history ({childTools.length})</span>
            </summary>
            <div className="mt-2 space-y-1 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
              {childTools.map((child, index) => {
                const isCurrent = !isComplete && index === currentToolIndex;
                return (
                  <div
                    key={child.toolId}
                    className={`flex items-start gap-2 rounded px-1.5 py-1 text-xs ${
                      isCurrent
                        ? 'bg-purple-50 dark:bg-purple-950/20'
                        : child.toolResult?.isError
                        ? 'bg-red-50 dark:bg-red-950/10'
                        : ''
                    }`}
                  >
                    <span className="w-5 flex-shrink-0 pt-0.5 text-right font-mono text-gray-400 dark:text-gray-500">
                      {index + 1}.
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-purple-500 dark:bg-purple-400" />
                        )}
                        <span className={`font-semibold ${isCurrent ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {child.toolName}
                        </span>
                        {child.toolResult?.isError && (
                          <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-[10px] font-medium">ERROR</span>
                          </span>
                        )}
                        {!isCurrent && !child.toolResult?.isError && (
                          <svg className="h-3 w-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {getCompactToolDisplay(child.toolName, child.toolInput) && (
                        <div className="truncate font-mono text-[11px] text-gray-500 dark:text-gray-400">
                          {getCompactToolDisplay(child.toolName, child.toolInput)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Final result */}
        {isComplete && toolResult && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {(() => {
              let content = toolResult.content;

              // Handle JSON string that needs parsing
              if (typeof content === 'string') {
                try {
                  const parsed = JSON.parse(content);
                  if (Array.isArray(parsed)) {
                    // Extract text from array format like [{"type":"text","text":"..."}]
                    const textParts = parsed
                      .filter((p: any) => p.type === 'text' && p.text)
                      .map((p: any) => p.text);
                    if (textParts.length > 0) {
                      content = textParts.join('\n');
                    }
                  }
                } catch {
                  // Not JSON, use as-is
                }
              } else if (Array.isArray(content)) {
                // Direct array format
                const textParts = content
                  .filter((p: any) => p.type === 'text' && p.text)
                  .map((p: any) => p.text);
                if (textParts.length > 0) {
                  content = textParts.join('\n');
                }
              }

              return typeof content === 'string' ? (
                <div className="line-clamp-6 whitespace-pre-wrap break-words">
                  {content}
                </div>
              ) : content ? (
                <pre className="line-clamp-6 whitespace-pre-wrap break-words font-mono text-[11px]">
                  {JSON.stringify(content, null, 2)}
                </pre>
              ) : null;
            })()}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};
