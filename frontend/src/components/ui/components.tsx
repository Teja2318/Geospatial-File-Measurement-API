import { cn, statusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isCompleted = status === 'COMPLETED';
  const isProcessing = status === 'PROCESSING';
  const isFailed = status === 'FAILED';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
        isCompleted && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10',
        isProcessing && 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sm shadow-sky-500/10',
        isFailed && 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/10',
        !isCompleted && !isProcessing && !isFailed && statusColor(status),
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isCompleted && 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          isProcessing && 'bg-sky-400 animate-ping',
          isFailed && 'bg-rose-400',
          !isCompleted && !isProcessing && !isFailed && 'bg-current opacity-70'
        )}
      />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-slate-700/60 transition-all duration-300',
        padding && 'p-5 md:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 shadow-lg shadow-indigo-500/10">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>
      {action}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }[size];

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          sizeClass,
          'border-slate-800 border-t-cyan-400 border-r-indigo-500 rounded-full animate-spin shadow-lg shadow-cyan-500/20'
        )}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 animate-pulse">
      <div className="h-4 bg-slate-800/80 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-800/80 rounded w-1/2" />
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl backdrop-blur-2xl">
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all shadow-lg',
              destructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
