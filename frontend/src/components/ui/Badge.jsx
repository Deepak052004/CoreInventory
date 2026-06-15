import { clsx } from 'clsx';

const variants = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
