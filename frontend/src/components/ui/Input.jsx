import { clsx } from 'clsx';

export function Input({ className, error, ...props }) {
  return (
    <input
      className={clsx(
        'w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
        error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }) {
  return <label className={clsx('block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1', className)} {...props} />;
}
