import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../lib/utils';

type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeSelectorProps = {
  ariaLabel?: string;
};

function ThemeSelector({ ariaLabel = 'Select theme' }: ThemeSelectorProps) {
  const { themeMode, setTheme } = useTheme();

  const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'auto', icon: Monitor, label: 'Auto' },
  ];

  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label={ariaLabel}>
      {themes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200',
            'touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            themeMode === mode
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted',
          )}
          role="radio"
          aria-checked={themeMode === mode}
          aria-label={`${label} theme`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeSelector;
