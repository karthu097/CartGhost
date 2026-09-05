import clsx from 'clsx';
import { getInitials } from '../../utils/formatters';

const colors = [
  'bg-brand-600', 'bg-green-600', 'bg-blue-600', 'bg-purple-600',
  'bg-pink-600', 'bg-orange-500', 'bg-teal-600', 'bg-indigo-600',
];

function hashColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xff;
  return colors[hash % colors.length];
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
        sizeClasses[size],
        hashColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
