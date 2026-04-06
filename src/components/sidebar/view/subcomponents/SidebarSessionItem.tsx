import { Check, Edit2, Trash2, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '../../../../lib/utils';
import { formatTimeAgo } from '../../../../utils/dateUtils';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { SessionWithProvider } from '../../types/types';
import { createSessionViewModel } from '../../utils/utils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

type SidebarSessionItemProps = {
  project: Project;
  session: SessionWithProvider;
  selectedSession: ProjectSession | null;
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
  t: TFunction;
};

export default function SidebarSessionItem({
  project,
  session,
  selectedSession,
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
  t,
}: SidebarSessionItemProps) {
  const sessionView = createSessionViewModel(session, currentTime, t);
  const isSelected = selectedSession?.id === session.id;

  const selectMobileSession = () => {
    onProjectSelect(project);
    onSessionSelect(session, project.name);
  };

  const saveEditedSession = () => {
    onSaveEditingSession(project.name, session.id, editingSessionName, session.__provider);
  };

  const requestDeleteSession = () => {
    onDeleteSession(project.name, session.id, sessionView.sessionName, session.__provider);
  };

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <button
          className={cn(
            'w-full px-3 py-2.5 text-left transition-colors',
            isSelected
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
          )}
          onClick={selectMobileSession}
          aria-label={`Select conversation: ${sessionView.sessionName}`}
          aria-current={isSelected ? 'page' : undefined}
        >
          <div className="flex items-center gap-2">
            <SessionProviderLogo provider={session.__provider} className="w-4 h-4 flex-shrink-0" />
            <div className="text-sm font-normal truncate leading-tight text-gray-900 dark:text-gray-100">
              {sessionView.sessionName}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-6">
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {formatTimeAgo(sessionView.sessionTime, currentTime, t)}
            </span>
            {sessionView.isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" aria-label="Active conversation" />
            )}
          </div>
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden md:block group/session">
        <button
          className={cn(
            'w-full px-3 py-2 text-left transition-colors relative',
            isSelected
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
          )}
          onClick={() => onSessionSelect(session, project.name)}
          aria-label={`Select conversation: ${sessionView.sessionName}`}
          aria-current={isSelected ? 'page' : undefined}
        >
          <div className="flex items-start gap-2">
            <SessionProviderLogo provider={session.__provider} className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-normal truncate flex-1 leading-tight text-gray-900 dark:text-gray-100">
              {sessionView.sessionName}
            </div>
          </div>
          {sessionView.isActive && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-green-500" aria-label="Active conversation" />
          )}
          <div className="text-xs font-normal mt-1 ml-6 text-gray-500 dark:text-gray-400">
            {formatTimeAgo(sessionView.sessionTime, currentTime, t)}
            {sessionView.messageCount > 0 && (
              <span className="opacity-0 group-hover/session:opacity-100 transition-opacity">
                {' · '}{sessionView.messageCount} messages
              </span>
            )}
          </div>

          {/* Actions on hover */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/session:opacity-100 transition-opacity">
            {editingSession === session.id ? (
              <>
                <input
                  type="text"
                  value={editingSessionName}
                  onChange={(event) => onEditingSessionNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') saveEditedSession();
                    else if (event.key === 'Escape') onCancelEditingSession();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-36 rounded px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                  autoFocus
                  aria-label="Edit conversation name"
                />
                <button
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation();
                    saveEditedSession();
                  }}
                  aria-label="Save"
                >
                  <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelEditingSession();
                  }}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEditingSession(session.id, sessionView.sessionName);
                  }}
                  aria-label={t('tooltips.editSessionName')}
                >
                  <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                {!sessionView.isCursorSession && (
                  <button
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestDeleteSession();
                    }}
                    aria-label={t('tooltips.deleteSession')}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500" />
                  </button>
                )}
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
