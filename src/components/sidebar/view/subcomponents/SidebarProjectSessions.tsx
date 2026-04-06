import { ChevronDown, Plus } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Button } from '../../../../shared/view/ui';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { SessionWithProvider } from '../../types/types';
import SidebarSessionItem from './SidebarSessionItem';

type SidebarProjectSessionsProps = {
  project: Project;
  isExpanded: boolean;
  sessions: SessionWithProvider[];
  selectedSession: ProjectSession | null;
  initialSessionsLoaded: boolean;
  isLoadingSessions: boolean;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  onEditingSessionNameChange: (value: string) => void;
  onStartEditingSession: (sessionId: string, initialName: string) => void;
  onCancelEditingSession: () => void;
  onSaveEditingSession: (projectName: string, sessionId: string, summary: string, provider: SessionProvider) => void;
  onProjectSelect: (project: Project) => void;
  onSessionSelect: (session: SessionWithProvider, projectName: string) => void;
  onDeleteSession: (
    projectName: string,
    sessionId: string,
    sessionTitle: string,
    provider: SessionProvider,
  ) => void;
  onLoadMoreSessions: (project: Project) => void;
  onNewSession: (project: Project) => void;
  t: TFunction;
};

function SessionListSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="px-3 py-2 rounded-lg">
          <div className="space-y-1.5">
            <div className="h-3 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" style={{ width: `${70 + index * 10}%` }} />
            <div className="h-2.5 w-1/4 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SidebarProjectSessions({
  project,
  isExpanded,
  sessions,
  selectedSession,
  initialSessionsLoaded,
  isLoadingSessions,
  currentTime,
  editingSession,
  editingSessionName,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  onProjectSelect,
  onSessionSelect,
  onDeleteSession,
  onLoadMoreSessions,
  onNewSession,
  t,
}: SidebarProjectSessionsProps) {
  if (!isExpanded) {
    return null;
  }

  const hasSessions = sessions.length > 0;
  const hasMoreSessions = project.sessionMeta?.hasMore === true;

  return (
    <div className="mt-2">
      {/* New session button */}
      <div className="px-2 mb-2">
        <button
          className="w-full py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 rounded"
          onClick={() => onNewSession(project)}
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Sessions list */}
      <div>
        {!initialSessionsLoaded ? (
          <div className="space-y-1 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2 px-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" style={{ width: `${70 + i * 10}%` }} />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : !hasSessions && !isLoadingSessions ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SidebarSessionItem
              key={session.id}
              project={project}
              session={session}
              selectedSession={selectedSession}
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
              t={t}
            />
          ))
        )}

        {hasSessions && hasMoreSessions && (
          <div className="px-2 mt-2">
            <button
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              onClick={() => onLoadMoreSessions(project)}
              disabled={isLoadingSessions}
            >
              {isLoadingSessions ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <ChevronDown className="h-4 w-4" />
                  Show more
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
