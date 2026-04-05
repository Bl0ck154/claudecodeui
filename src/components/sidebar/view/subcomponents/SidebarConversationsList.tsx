import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { SessionWithProvider } from '../../types/types';
import SidebarSessionItem from './SidebarSessionItem';

type SidebarConversationsListProps = {
  projects: Project[];
  selectedSession: ProjectSession | null;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  getProjectSessions: (project: Project) => SessionWithProvider[];
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
  searchFilter: string;
  t: TFunction;
};

type SessionWithProject = {
  session: SessionWithProvider;
  project: Project;
  lastActivity: Date;
};

export default function SidebarConversationsList({
  projects,
  selectedSession,
  currentTime,
  editingSession,
  editingSessionName,
  getProjectSessions,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  onProjectSelect,
  onSessionSelect,
  onDeleteSession,
  searchFilter,
  t,
}: SidebarConversationsListProps) {
  const allConversations = useMemo(() => {
    const conversations: SessionWithProject[] = [];

    projects.forEach((project) => {
      const sessions = getProjectSessions(project);
      sessions.forEach((session) => {
        const lastActivity = session.lastActivity
          ? new Date(session.lastActivity)
          : new Date(0);

        conversations.push({
          session,
          project,
          lastActivity,
        });
      });
    });

    // Sort by last activity (newest first)
    conversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Filter by search query if provided
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      return conversations.filter(({ session }) => {
        const summary = session.summary?.toLowerCase() || '';
        return summary.includes(query);
      });
    }

    return conversations;
  }, [projects, getProjectSessions, searchFilter]);

  if (allConversations.length === 0) {
    return (
      <div className="px-4 py-12 text-center md:py-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted md:mb-3">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="mb-2 text-base font-medium text-foreground md:mb-1">
          {searchFilter.trim() ? t('search.noResults') : t('conversations.noConversations')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {searchFilter.trim() ? t('search.tryDifferentQuery') : t('conversations.startNewConversation')}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-safe-area-inset-bottom md:space-y-0.5">
      {allConversations.map(({ session, project }) => (
        <SidebarSessionItem
          key={`${project.name}-${session.id}`}
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
      ))}
    </div>
  );
}
