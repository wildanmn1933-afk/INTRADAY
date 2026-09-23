import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  rows?: number;
  count?: number;
  message?: string;
  className?: string;
  variant?: 'table' | 'cards' | 'chart';
}

export function LoadingState({
  rows,
  count,
  message,
  className,
  variant = 'cards',
}: LoadingStateProps) {
  const itemCount = count ?? rows ?? 4;

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2 p-2', className)}>
        {message && <p className="text-xs font-mono text-neutral-400 mb-2">{message}</p>}
        <Skeleton className="h-8 w-full bg-neutral-900" />
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-neutral-900/60" />
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40', className)}>
        {message && <p className="text-xs font-mono text-neutral-400 mb-2">{message}</p>}
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32 bg-neutral-850" />
          <Skeleton className="h-5 w-20 bg-neutral-850" />
        </div>
        <Skeleton className="h-44 w-full bg-neutral-900" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 p-2', className)}>
      {message && <p className="text-xs font-mono text-neutral-400 px-1">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-neutral-850" />
              <Skeleton className="h-4 w-12 bg-neutral-850" />
            </div>
            <Skeleton className="h-6 w-3/4 bg-neutral-850" />
            <Skeleton className="h-10 w-full bg-neutral-900/80" />
          </div>
        ))}
      </div>
    </div>
  );
}
