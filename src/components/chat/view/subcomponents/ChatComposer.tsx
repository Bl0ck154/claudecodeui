import { useTranslation } from 'react-i18next';
import type {
  ChangeEvent,
  ClipboardEvent,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  SetStateAction,
  TouchEvent,
} from 'react';
import MicButton from '../../../mic-button/view/MicButton';
import type { PendingPermissionRequest, PermissionMode, Provider } from '../../types/types';
import CommandMenu from './CommandMenu';
import ImageAttachment from './ImageAttachment';
import PermissionRequestsBanner from './PermissionRequestsBanner';
import ChatInputControls from './ChatInputControls';

interface MentionableFile {
  name: string;
  path: string;
}

interface SlashCommand {
  name: string;
  description?: string;
  namespace?: string;
  path?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ChatComposerProps {
  pendingPermissionRequests: PendingPermissionRequest[];
  handlePermissionDecision: (
    requestIds: string | string[],
    decision: { allow?: boolean; message?: string; rememberEntry?: string | null; updatedInput?: unknown },
  ) => void;
  handleGrantToolPermission: (suggestion: { entry: string; toolName: string }) => { success: boolean };
  provider: Provider | string;
  permissionMode: PermissionMode | string;
  onModeSwitch: () => void;
  thinkingMode: string;
  setThinkingMode: Dispatch<SetStateAction<string>>;
  slashCommandsCount: number;
  onToggleCommandMenu: () => void;
  hasInput: boolean;
  onClearInput: () => void;
  isUserScrolledUp: boolean;
  hasMessages: boolean;
  onScrollToBottom: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => void;
  isDragActive: boolean;
  attachedImages: File[];
  onRemoveImage: (index: number) => void;
  uploadingImages: Map<string, number>;
  imageErrors: Map<string, string>;
  showFileDropdown: boolean;
  filteredFiles: MentionableFile[];
  selectedFileIndex: number;
  onSelectFile: (file: MentionableFile) => void;
  filteredCommands: SlashCommand[];
  selectedCommandIndex: number;
  onCommandSelect: (command: SlashCommand, index: number, isHover: boolean) => void;
  onCloseCommandMenu: () => void;
  isCommandMenuOpen: boolean;
  frequentCommands: SlashCommand[];
  getRootProps: (...args: unknown[]) => Record<string, unknown>;
  getInputProps: (...args: unknown[]) => Record<string, unknown>;
  openImagePicker: () => void;
  inputHighlightRef: RefObject<HTMLDivElement>;
  renderInputWithMentions: (text: string) => ReactNode;
  textareaRef: RefObject<HTMLTextAreaElement>;
  input: string;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onTextareaClick: (event: MouseEvent<HTMLTextAreaElement>) => void;
  onTextareaKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onTextareaPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onTextareaScrollSync: (target: HTMLTextAreaElement) => void;
  onTextareaInput: (event: FormEvent<HTMLTextAreaElement>) => void;
  onInputFocusChange?: (focused: boolean) => void;
  isInputFocused?: boolean;
  placeholder: string;
  isTextareaExpanded: boolean;
  sendByCtrlEnter?: boolean;
  onTranscript: (text: string) => void;
}

export default function ChatComposer({
  pendingPermissionRequests,
  handlePermissionDecision,
  handleGrantToolPermission,
  provider,
  permissionMode,
  onModeSwitch,
  thinkingMode,
  setThinkingMode,
  slashCommandsCount,
  onToggleCommandMenu,
  hasInput,
  onClearInput,
  isUserScrolledUp,
  hasMessages,
  onScrollToBottom,
  onSubmit,
  isDragActive,
  attachedImages,
  onRemoveImage,
  uploadingImages,
  imageErrors,
  showFileDropdown,
  filteredFiles,
  selectedFileIndex,
  onSelectFile,
  filteredCommands,
  selectedCommandIndex,
  onCommandSelect,
  onCloseCommandMenu,
  isCommandMenuOpen,
  frequentCommands,
  getRootProps,
  getInputProps,
  openImagePicker,
  inputHighlightRef,
  renderInputWithMentions,
  textareaRef,
  input,
  onInputChange,
  onTextareaClick,
  onTextareaKeyDown,
  onTextareaPaste,
  onTextareaScrollSync,
  onTextareaInput,
  onInputFocusChange,
  isInputFocused,
  placeholder,
  isTextareaExpanded,
  sendByCtrlEnter,
  onTranscript,
}: ChatComposerProps) {
  const { t } = useTranslation('chat');
  const textareaRect = textareaRef.current?.getBoundingClientRect();
  const commandMenuPosition = {
    top: textareaRect ? Math.max(16, textareaRect.top - 316) : 0,
    left: textareaRect ? textareaRect.left : 16,
    bottom: textareaRect ? window.innerHeight - textareaRect.top + 8 : 90,
  };

  // Detect if the AskUserQuestion interactive panel is active
  const hasQuestionPanel = pendingPermissionRequests.some(
    (r) => r.toolName === 'AskUserQuestion'
  );

  // On mobile, when input is focused, float the input box at the bottom
  const mobileFloatingClass = isInputFocused
    ? 'max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-50 max-sm:bg-background max-sm:shadow-[0_-4px_20px_rgba(0,0,0,0.15)]'
    : '';

  return (
    <div className={`flex-shrink-0 p-2 pb-2 sm:p-4 sm:pb-4 md:p-4 md:pb-6 ${mobileFloatingClass}`}>
      <div className="mx-auto mb-3 max-w-3xl px-4">
        <PermissionRequestsBanner
          pendingPermissionRequests={pendingPermissionRequests}
          handlePermissionDecision={handlePermissionDecision}
          handleGrantToolPermission={handleGrantToolPermission}
        />
      </div>

      {!hasQuestionPanel && <form onSubmit={onSubmit as (event: FormEvent<HTMLFormElement>) => void} className="relative mx-auto max-w-3xl px-4">
        {isDragActive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-primary/15">
            <div className="rounded-xl border border-border/30 bg-card p-4 shadow-lg">
              <svg className="mx-auto mb-2 h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium">Drop images here</p>
            </div>
          </div>
        )}

        {attachedImages.length > 0 && (
          <div className="mb-2 rounded-xl bg-muted/40 p-2">
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((file, index) => (
                <ImageAttachment
                  key={index}
                  file={file}
                  onRemove={() => onRemoveImage(index)}
                  uploadProgress={uploadingImages.get(file.name)}
                  error={imageErrors.get(file.name)}
                />
              ))}
            </div>
          </div>
        )}

        {showFileDropdown && filteredFiles.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-card/95 shadow-lg backdrop-blur-md">
            {filteredFiles.map((file, index) => (
              <div
                key={file.path}
                className={`cursor-pointer touch-manipulation border-b border-border/30 px-4 py-3 last:border-b-0 ${
                  index === selectedFileIndex
                    ? 'bg-primary/8 text-primary'
                    : 'text-foreground hover:bg-accent/50'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectFile(file);
                }}
              >
                <div className="text-sm font-medium">{file.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{file.path}</div>
              </div>
            ))}
          </div>
        )}

        <CommandMenu
          commands={filteredCommands}
          selectedIndex={selectedCommandIndex}
          onSelect={onCommandSelect}
          onClose={onCloseCommandMenu}
          position={commandMenuPosition}
          isOpen={isCommandMenuOpen}
          frequentCommands={frequentCommands}
        />

        <div
          {...getRootProps()}
          className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:shadow-md ${
            isTextareaExpanded ? 'chat-input-expanded' : ''
          }`}
        >
          <input {...getInputProps()} />
          <div ref={inputHighlightRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <div className="chat-input-placeholder block w-full whitespace-pre-wrap break-words py-3 pl-3 pr-3 pb-12 text-base leading-6 text-transparent sm:py-3 sm:pl-3 sm:pr-3 sm:pb-12">
              {renderInputWithMentions(input)}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInputChange}
              onClick={onTextareaClick}
              onKeyDown={onTextareaKeyDown}
              onPaste={onTextareaPaste}
              onScroll={(event) => onTextareaScrollSync(event.target as HTMLTextAreaElement)}
              onFocus={() => onInputFocusChange?.(true)}
              onBlur={() => onInputFocusChange?.(false)}
              onInput={onTextareaInput}
              placeholder={placeholder}
              className="chat-input-placeholder block max-h-[40vh] min-h-[48px] w-full resize-none overflow-y-auto bg-transparent py-3 pl-3 pr-3 pb-12 text-base leading-6 text-foreground placeholder-muted-foreground/60 transition-all duration-200 focus:outline-none sm:max-h-[300px] sm:min-h-[48px] sm:py-3 sm:pr-3 sm:pb-12"
              style={{ height: '48px' }}
            />

            {/* Bottom toolbar panel */}
            <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between px-2">
              {/* Left side icons */}
              <div className="flex items-center gap-1">
              {/* Image upload button */}
              <button
                type="button"
                onClick={openImagePicker}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={t('input.attachImages')}
                aria-label={t('input.attachImages')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>

              {/* Permission Mode Button */}
              <button
                type="button"
                onClick={onModeSwitch}
                className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all duration-200 ${
                  permissionMode === 'default'
                    ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                title={t('input.clickToChangeMode')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-[9px] leading-none">
                  {permissionMode === 'default' ? 'Auto' :
                   permissionMode === 'acceptEdits' ? 'Accept' :
                   permissionMode === 'bypassPermissions' ? 'Bypass' : 'Plan'}
                </span>
              </button>

              {/* Thinking Mode Button */}
              {provider === 'claude' && (
                <button
                  type="button"
                  onClick={() => {
                    const modes = ['default', 'extended', 'deep'];
                    const currentIndex = modes.indexOf(thinkingMode);
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    setThinkingMode(nextMode);
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all duration-200 ${
                    thinkingMode === 'default'
                      ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  title={`Thinking mode: ${thinkingMode}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-[9px] leading-none capitalize">{thinkingMode}</span>
                </button>
              )}

              {/* Commands Button */}
              <button
                type="button"
                onClick={onToggleCommandMenu}
                className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={t('input.showAllCommands')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {slashCommandsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {slashCommandsCount}
                  </span>
                )}
              </button>
            </div>

              {/* Right side - send button */}
              <button
                type="button"
                disabled={!input.trim()}
                onClick={(event) => {
                  event.preventDefault();
                  onSubmit(event);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                <svg className="h-4 w-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>}

      {!hasQuestionPanel && (
        <div className="mx-auto mt-2 max-w-3xl px-4">
          <ChatInputControls
            permissionMode={permissionMode}
            onModeSwitch={onModeSwitch}
            provider={provider}
            thinkingMode={thinkingMode}
            setThinkingMode={setThinkingMode}
            slashCommandsCount={slashCommandsCount}
            onToggleCommandMenu={onToggleCommandMenu}
            hasInput={hasInput}
            onClearInput={onClearInput}
            isUserScrolledUp={isUserScrolledUp}
            hasMessages={hasMessages}
            onScrollToBottom={onScrollToBottom}
          />
        </div>
      )}
    </div>
  );
}
