import clsx from 'clsx';
import { getRecoveryBgColor } from '../../utils/formatters';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  colorByValue?: boolean;
  color?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  className,
  colorByValue = false,
  color = 'bg-brand-500',
  showLabel = false,
}: ProgressBarProps) {
  const barColor = colorByValue ? getRecoveryBgColor(value) : color;
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-slate-500 tabular-nums w-8 shrink-0">{value}%</span>}
    </div>
  );
}
