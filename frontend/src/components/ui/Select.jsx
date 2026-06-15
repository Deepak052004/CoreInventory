import { clsx } from 'clsx';

export function Select({ className, error, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
        error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
