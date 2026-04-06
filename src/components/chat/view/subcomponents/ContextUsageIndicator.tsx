import { useMemo } from 'react';

interface ContextUsageIndicatorProps {
  tokens: number;
  maxTokens?: number;
}

export default function ContextUsageIndicator({ tokens, maxTokens = 200000 }: ContextUsageIndicatorProps) {
  const percentage = useMemo(() => Math.min((tokens / maxTokens) * 100, 100), [tokens, maxTokens]);
  
  const color = useMemo(() => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [percentage]);

  if (tokens === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div 
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="tabular-nums">{Math.round(percentage)}%</span>
    </div>
  );
}
