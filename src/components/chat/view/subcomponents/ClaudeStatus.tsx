import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import ContextUsageIndicator from './ContextUsageIndicator';

type ClaudeStatusProps = {
  status: {
    text?: string;
    tokens?: number;
    can_interrupt?: boolean;
  } | null;
  onAbort?: () => void;
  isLoading: boolean;
  provider?: string;
};

const ACTION_KEYS = [
  'claudeStatus.actions.thinking',
  'claudeStatus.actions.processing',
  'claudeStatus.actions.analyzing',
  'claudeStatus.actions.working',
  'claudeStatus.actions.computing',
  'claudeStatus.actions.reasoning',
];
const DEFAULT_ACTION_WORDS = ['Thinking', 'Processing', 'Analyzing', 'Working', 'Computing', 'Reasoning'];
const ANIMATION_STEPS = 40;

const PROVIDER_LABEL_KEYS: Record<string, string> = {
  claude: 'messageTypes.claude',
  codex: 'messageTypes.codex',
  cursor: 'messageTypes.cursor',
  gemini: 'messageTypes.gemini',
};

function formatElapsedTime(totalSeconds: number, t: (key: string, options?: Record<string, unknown>) => string) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 1) {
    return t('claudeStatus.elapsed.seconds', { count: seconds, defaultValue: '{{count}}s' });
  }

  return t('claudeStatus.elapsed.minutesSeconds', {
    minutes,
    seconds,
    defaultValue: '{{minutes}}m {{seconds}}s',
  });
}

export default function ClaudeStatus({
  status,
  onAbort,
  isLoading,
  provider = 'claude',
}: ClaudeStatusProps) {
  const { t } = useTranslation('chat');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setAnimationPhase((previous) => (previous + 1) % ANIMATION_STEPS);
    }, 500);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  // Note: showThinking only controls the reasoning accordion in messages, not this processing indicator
  if (!isLoading && !status) {
    return null;
  }

  const actionWords = ACTION_KEYS.map((key, index) => t(key, { defaultValue: DEFAULT_ACTION_WORDS[index] }));
  const actionIndex = Math.floor(elapsedTime / 3) % actionWords.length;
  const statusText = status?.text || actionWords[actionIndex];
  const cleanStatusText = statusText.replace(/[.]+$/, '');
  const canInterrupt = isLoading && status?.can_interrupt !== false;
  const providerLabelKey = PROVIDER_LABEL_KEYS[provider];
  const providerLabel = providerLabelKey
    ? t(providerLabelKey)
    : t('claudeStatus.providers.assistant', { defaultValue: 'Assistant' });
  const animatedDots = '.'.repeat((animationPhase % 3) + 1);
  const elapsedLabel =
    elapsedTime > 0
      ? t('claudeStatus.elapsed.label', {
          time: formatElapsedTime(elapsedTime, t),
          defaultValue: '{{time}} elapsed',
        })
      : t('claudeStatus.elapsed.startingNow', { defaultValue: 'Starting now' });

  return (
    <div className="animate-in slide-in-from-bottom px-4">
      {/* Match assistant message layout: avatar on left, message bubble on right */}
      <div className="flex w-full items-start space-x-3">
        {/* Avatar matching MessageComponent assistant avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 p-1.5">
          <SessionProviderLogo provider={provider} className="h-full w-full" />
        </div>

        {/* Message bubble matching assistant message style */}
        <div className="max-w-2xl flex-1 rounded-2xl bg-amber-50/30 dark:bg-gray-800/40 px-4 py-3">
          <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            {providerLabel}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">
            {cleanStatusText}
            {isLoading && (
              <span aria-hidden="true" className="text-primary">
                {animatedDots}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-500">
            <span>{elapsedLabel}</span>
            {status?.tokens && <ContextUsageIndicator tokens={status.tokens} />}
            {canInterrupt && onAbort && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={onAbort}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                >
                  {t('claudeStatus.controls.stopGeneration', { defaultValue: 'Stop Generation' })}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
