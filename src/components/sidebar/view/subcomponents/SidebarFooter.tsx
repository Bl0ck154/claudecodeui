import { Settings, ArrowUpCircle, Github } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { ReleaseInfo } from '../../../../types/sharedTypes';

const GITHUB_REPO_URL = 'https://github.com/Bl0ck154/claudecodeui';

type SidebarFooterProps = {
  updateAvailable: boolean;
  releaseInfo: ReleaseInfo | null;
  latestVersion: string | null;
  onShowVersionModal: () => void;
  onShowSettings: () => void;
  t: TFunction;
};

export default function SidebarFooter({
  updateAvailable,
  releaseInfo,
  latestVersion,
  onShowVersionModal,
  onShowSettings,
  t,
}: SidebarFooterProps) {
  return (
    <div className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      {/* Update banner */}
      {updateAvailable && (
        <>
          <div className="h-px bg-gray-200 dark:bg-gray-800 mx-2" />
          {/* Desktop update */}
          <div className="hidden px-2 py-1.5 md:block">
            <button
              className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onShowVersionModal}
            >
              <div className="relative flex-shrink-0">
                <ArrowUpCircle className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-gray-900 dark:text-gray-100">
                  {releaseInfo?.title || `v${latestVersion}`}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {t('version.updateAvailable')}
                </span>
              </div>
            </button>
          </div>

          {/* Mobile update */}
          <div className="px-3 py-2 md:hidden">
            <button
              className="flex h-11 w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-100 px-3.5 transition-all active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800"
              onClick={onShowVersionModal}
            >
              <div className="relative flex-shrink-0">
                <ArrowUpCircle className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                  {releaseInfo?.title || `v${latestVersion}`}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('version.updateAvailable')}
                </span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* GitHub + Settings */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 mx-2" />

      {/* Desktop GitHub */}
      <div className="hidden px-2 pt-1.5 md:block">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="text-[13px]">{t('actions.viewRepository')}</span>
        </a>
      </div>

      {/* Desktop settings */}
      <div className="hidden px-2 py-1.5 md:block">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
          onClick={onShowSettings}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="text-[13px]">{t('actions.settings')}</span>
        </button>
      </div>

      {/* Mobile GitHub */}
      <div className="px-3 pt-3 md:hidden">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center gap-3.5 rounded-xl bg-muted/40 px-4 transition-all hover:bg-muted/60 active:scale-[0.98]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/80">
            <Github className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <span className="text-base font-medium text-foreground">{t('actions.viewRepository')}</span>
        </a>
      </div>

      {/* Mobile settings */}
      <div className="px-3 pb-20 pt-2 md:hidden">
        <button
          className="flex h-12 w-full items-center gap-3.5 rounded-xl bg-muted/40 px-4 transition-all hover:bg-muted/60 active:scale-[0.98]"
          onClick={onShowSettings}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/80">
            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <span className="text-base font-medium text-foreground">{t('actions.settings')}</span>
        </button>
      </div>
    </div>
  );
}
