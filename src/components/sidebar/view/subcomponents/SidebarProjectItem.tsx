import { Check, ChevronDown, ChevronRight, Edit3, Folder, FolderOpen, Star, Trash2, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Button } from '../../../../shared/view/ui';
import { cn } from '../../../../lib/utils';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { MCPServerStatus, SessionWithProvider } from '../../types/types';
import { getTaskIndicatorStatus, createSessionViewModel } from '../../utils/utils';
import TaskIndicator from './TaskIndicator';
import SidebarProjectSessions from './SidebarProjectSessions';

type SidebarProjectItemProps = {
  project: Project;
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  isExpanded: boolean;
  isDeleting: boolean;
  isStarred: boolean;
  editingProject: string | null;
  editingName: string;
  sessions: SessionWithProvider[];
  initialSessionsLoaded: boolean;
  isLoadingSessions: boolean;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  tasksEnabled: boolean;
  mcpServerStatus: MCPServerStatus;
  onEditingNameChange: (name: string) => void;
  onToggleProject: (projectName: string) => void;
  onProjectSelect: (project: Project) => void;
  onToggleStarProject: (projectName: string) => void;
  onStartEditingProject: (project: Project) => void;
  onCancelEditingProject: () => void;
  onSaveProjectName: (projectName: string) => void;
  onDeleteProject: (project: Project) => void;
  onSessionSelect: (session: SessionWithProvider, projectName: string) => void;
  onDeleteSession: (
    projectName: string,
    sessionId: string,
    sessionTitle: string,
    provider: SessionProvider,
  ) => void;
  onLoadMoreSessions: (project: Project) => void;
  onNewSession: (project: Project) => void;
  onEditingSessionNameChange: (value: string) => void;
  onStartEditingSession: (sessionId: string, initialName: string) => void;
  onCancelEditingSession: () => void;
  onSaveEditingSession: (projectName: string, sessionId: string, summary: string, provider: SessionProvider) => void;
  t: TFunction;
};

const getSessionCountDisplay = (sessions: SessionWithProvider[], hasMoreSessions: boolean): string => {
  const sessionCount = sessions.length;
  if (hasMoreSessions && sessionCount >= 5) {
    return `${sessionCount}+`;
  }

  return `${sessionCount}`;
};

export default function SidebarProjectItem({
  project,
  selectedProject,
  selectedSession,
  isExpanded,
  isDeleting,
  isStarred,
  editingProject,
  editingName,
  sessions,
  initialSessionsLoaded,
  isLoadingSessions,
  currentTime,
  editingSession,
  editingSessionName,
  tasksEnabled,
  mcpServerStatus,
  onEditingNameChange,
  onToggleProject,
  onProjectSelect,
  onToggleStarProject,
  onStartEditingProject,
  onCancelEditingProject,
  onSaveProjectName,
  onDeleteProject,
  onSessionSelect,
  onDeleteSession,
  onLoadMoreSessions,
  onNewSession,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  t,
}: SidebarProjectItemProps) {
  const isSelected = selectedProject?.name === project.name;
  const isEditing = editingProject === project.name;
  const hasMoreSessions = project.sessionMeta?.hasMore === true;
  const sessionCountDisplay = getSessionCountDisplay(sessions, hasMoreSessions);
  const sessionCountLabel = `${sessionCountDisplay} session${sessions.length === 1 ? '' : 's'}`;
  const taskStatus = getTaskIndicatorStatus(project, mcpServerStatus);

  // Check if project has active sessions
  const hasActiveSessions = sessions.some((session) => {
    const sessionView = createSessionViewModel(session, currentTime, t);
    return sessionView.isActive;
  });

  const toggleProject = () => onToggleProject(project.name);
  const toggleStarProject = () => onToggleStarProject(project.name);

  const saveProjectName = () => {
    onSaveProjectName(project.name);
  };

  const selectAndToggleProject = () => {
    if (selectedProject?.name !== project.name) {
      onProjectSelect(project);
    }

    toggleProject();
  };

  return (
    <div className={cn('md:space-y-1', isDeleting && 'opacity-50 pointer-events-none')}>
      <div className="md:group group relative">
        {hasActiveSessions && (
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 transform z-10">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </div>
        )}

        <div className="md:hidden">
          <div
            className={cn(
              'p-3 mx-3 my-1 rounded-lg bg-card border border-border/50 active:scale-[0.98] transition-all duration-150',
              isSelected && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
              isStarred &&
                !isSelected &&
                'bg-yellow-50/50 dark:bg-yellow-900/5 border-yellow-200/30 dark:border-yellow-800/30',
              hasActiveSessions && 'border-green-500/30 bg-green-50/5 dark:bg-green-900/5',
            )}
            onClick={toggleProject}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isExpanded ? 'bg-gray-200 dark:bg-gray-700' : 'bg-muted',
                  )}
                >
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      className="w-full rounded-lg border-2 border-primary/40 bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200 focus:border-primary focus:shadow-md focus:outline-none"
                      placeholder={t('projects.projectNamePlaceholder')}
                      autoFocus
                      autoComplete="off"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveProjectName();
                        }

                        if (event.key === 'Escape') {
                          onCancelEditingProject();
                        }
                      }}
                      style={{
                        fontSize: '16px',
                        WebkitAppearance: 'none',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium text-foreground">{project.displayName}</h3>
                          {hasActiveSessions && (
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            </div>
                          )}
                        </div>
                        {tasksEnabled && (
                          <TaskIndicator
                            status={taskStatus}
                            size="xs"
                            className="ml-2 hidden flex-shrink-0 md:inline-flex"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{sessionCountLabel}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 shadow-sm transition-all duration-150 active:scale-90 active:shadow-none dark:bg-green-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveProjectName();
                      }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500 shadow-sm transition-all duration-150 active:scale-90 active:shadow-none dark:bg-gray-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancelEditingProject();
                      }}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all duration-150 border',
                        isStarred
                          ? 'bg-yellow-500/10 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                          : 'bg-gray-500/10 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800',
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleStarProject();
                      }}
                      title={isStarred ? t('tooltips.removeFromFavorites') : t('tooltips.addToFavorites')}
                    >
                      <Star
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isStarred
                            ? 'text-yellow-600 dark:text-yellow-400 fill-current'
                            : 'text-gray-600 dark:text-gray-400',
                        )}
                      />
                    </button>

                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-500/10 active:scale-90 dark:border-red-800 dark:bg-red-900/30"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteProject(project);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>

                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 active:scale-90 dark:border-gray-400 dark:border-gray-600 dark:bg-gray-300 dark:bg-gray-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartEditingProject(project);
                      }}
                    >
                      <Edit3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/30">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className={cn(
            'hidden md:flex w-full justify-between px-2.5 py-2 h-auto font-normal transition-all duration-150 relative',
            'hover:bg-gray-50 dark:hover:bg-gray-800/60',
            'border-l-2 border-l-transparent',
            'rounded-md',
            isSelected && 'bg-gray-100 dark:bg-gray-800 border-l-gray-400 dark:border-l-gray-500',
            isStarred && !isSelected && 'bg-gray-50/50 dark:bg-gray-900/30',
            hasActiveSessions && 'border-l-green-500',
          )}
          onClick={selectAndToggleProject}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-6">
            <div className={cn(
              "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors",
              isExpanded ? "bg-gray-200 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800"
            )}>
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left select-text">
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(event) => onEditingNameChange(event.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-background px-2 py-1 text-sm text-foreground focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500"
                    placeholder={t('projects.projectNamePlaceholder')}
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        saveProjectName();
                      }
                      if (event.key === 'Escape') {
                        onCancelEditingProject();
                      }
                    }}
                  />
                  <div className="truncate text-xs text-gray-500 dark:text-gray-500" title={project.fullPath}>
                    {project.fullPath}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[13px] font-medium text-gray-900 dark:text-gray-100" title={project.displayName}>
                      {project.displayName}
                    </div>
                    {hasActiveSessions && !isEditing && (
                      <div className="flex-shrink-0">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5 font-normal">
                    {sessionCountDisplay} {sessions.length === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute right-2 bottom-2 flex flex-shrink-0 items-center gap-0.5">
            {isEditing ? (
              <>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    saveProjectName();
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelEditingProject();
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    'w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center rounded cursor-pointer',
                    isStarred ? 'hover:bg-gray-100 dark:hover:bg-gray-700 opacity-100' : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleStarProject();
                  }}
                  title={isStarred ? t('tooltips.removeFromFavorites') : t('tooltips.addToFavorites')}
                >
                  <Star
                    className={cn(
                      'w-3 h-3 transition-colors',
                      isStarred
                        ? 'text-gray-700 dark:text-gray-300 fill-current'
                        : 'text-gray-400 dark:text-gray-500',
                    )}
                  />
                </div>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEditingProject(project);
                  }}
                  title={t('tooltips.renameProject')}
                >
                  <Edit3 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </div>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteProject(project);
                  }}
                  title={t('tooltips.deleteProject')}
                >
                  <Trash2 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-400" />
                )}
              </>
            )}
          </div>
        </Button>
      </div>

      <SidebarProjectSessions
        project={project}
        isExpanded={isExpanded}
        sessions={sessions}
        selectedSession={selectedSession}
        initialSessionsLoaded={initialSessionsLoaded}
        isLoadingSessions={isLoadingSessions}
        currentTime={currentTime}
        editingSession={editingSession}
        editingSessionName={editingSessionName}
        onEditingSessionNameChange={onEditingSessionNameChange}
        onStartEditingSession={onStartEditingSession}
        onCancelEditingSession={onCancelEditingSession}
        onSaveEditingSession={onSaveEditingSession}
        onProjectSelect={onProjectSelect}
        onSessionSelect={onSessionSelect}
        onDeleteSession={onDeleteSession}
        onLoadMoreSessions={onLoadMoreSessions}
        onNewSession={onNewSession}
        t={t}
      />
    </div>
  );
}
