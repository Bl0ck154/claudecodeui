type TokenUsagePieProps = {
  used: number;
  total: number;
};

export default function TokenUsagePie({ used, total }: TokenUsagePieProps) {
  // Token usage visualization component
  // Only bail out on missing values or non‐positive totals; allow used===0 to render 0%
  if (used == null || total == null || total <= 0) return null;

  const percentage = Math.min(100, (used / total) * 100);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on usage level
  const getColor = () => {
    if (percentage < 60) return 'hsl(var(--primary))'; // primary color
    if (percentage < 80) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
      <svg width="20" height="20" viewBox="0 0 24 24" className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/50"
        />
        {/* Progress circle */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span title={`${used.toLocaleString()} / ${total.toLocaleString()} tokens`}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}