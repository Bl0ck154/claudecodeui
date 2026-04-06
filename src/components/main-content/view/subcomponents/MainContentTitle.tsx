import { useTranslation } from 'react-i18next';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type { AppTab, Project, ProjectSession } from '../../../../types/app';
import { usePlugins } from '../../../../contexts/PluginsContext';
import TokenUsagePie from '../../../chat/view/subcomponents/TokenUsagePie';

type MainContentTitleProps = {
  activeTab: AppTab;
  selectedProject: Project;
  selectedSession: ProjectSession | null;
  shouldShowTasksTab: boolean;
  tokenBudget: { used?: number; total?: number } | null;
};

function getTabTitle(activeTab: AppTab, shouldShowTasksTab: boolean, t: (key: string) => string, pluginDisplayName?: string) {
  if (activeTab.startsWith('plugin:') && pluginDisplayName) {
    return pluginDisplayName;
  }

  if (activeTab === 'files') {
    return t('mainContent.projectFiles');
  }

  if (activeTab === 'git') {
    return t('tabs.git');
  }

  if (activeTab === 'tasks' && shouldShowTasksTab) {
    return 'TaskMaster';
  }

  return 'Project';
}

function getSessionTitle(session: ProjectSession): string {
  if (session.__provider === 'cursor') {
    return (session.name as string) || 'Untitled Session';
  }

  return (session.summary as string) || 'New Session';
}

export default function MainContentTitle({
  activeTab,
  selectedProject,
  selectedSession,
  shouldShowTasksTab,
  tokenBudget,
}: MainContentTitleProps) {
  const { t } = useTranslation();
  const { plugins } = usePlugins();

  const pluginDisplayName = activeTab.startsWith('plugin:')
    ? plugins.find((p) => p.name === activeTab.replace('plugin:', ''))?.displayName
    : undefined;

  const showSessionIcon = activeTab === 'chat' && Boolean(selectedSession);
  const showChatNewSession = activeTab === 'chat' && !selectedSession;

  const handleProjectPathClick = async () => {
    const fullPath = selectedProject.fullPath || selectedProject.name;

    // Try to copy to clipboard
    try {
      await navigator.clipboard.writeText(fullPath);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }

    // Try to open in file explorer
    try {
      // Use file:// protocol to open in explorer
      window.open(`file:///${fullPath}`, '_blank');
    } catch (err) {
      console.error('Failed to open in explorer:', err);
    }
  };

  return (
    <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
      {showSessionIcon && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
          <SessionProviderLogo provider={selectedSession?.__provider} className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {activeTab === 'chat' && selectedSession ? (
          <div className="min-w-0">
            <h2 className="scrollbar-hide overflow-x-auto whitespace-nowrap text-sm font-semibold leading-tight text-foreground">
              {getSessionTitle(selectedSession)}
            </h2>
            <div
              className="truncate text-[11px] leading-tight text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-text"
              onClick={handleProjectPathClick}
              title={`Click to copy: ${selectedProject.fullPath || selectedProject.name}`}
            >
              {selectedProject.displayName}
            </div>
          </div>
        ) : showChatNewSession ? (
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight text-foreground">{t('mainContent.newSession')}</h2>
            <div
              className="truncate text-xs leading-tight text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-text"
              onClick={handleProjectPathClick}
              title={`Click to copy: ${selectedProject.fullPath || selectedProject.name}`}
            >
              {selectedProject.displayName}
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-foreground">
              {getTabTitle(activeTab, shouldShowTasksTab, t, pluginDisplayName)}
            </h2>
            <div
              className="truncate text-[11px] leading-tight text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-text"
              onClick={handleProjectPathClick}
              title={`Click to copy: ${selectedProject.fullPath || selectedProject.name}`}
            >
              {selectedProject.displayName}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'chat' && tokenBudget && (
        <div className="flex-shrink-0">
          <TokenUsagePie
            used={tokenBudget?.used || 0}
            total={tokenBudget?.total || parseInt(import.meta.env.VITE_CONTEXT_WINDOW) || 160000}
          />
        </div>
      )}
    </div>
  );
}
