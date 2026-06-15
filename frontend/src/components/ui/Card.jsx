import { clsx } from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none backdrop-blur-sm transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={clsx('px-6 py-4 border-b border-slate-100 dark:border-slate-800', className)} {...props}>{children}</div>;
}

export function CardContent({ className, ...props }) {
  return <div className={clsx('p-6', className)} {...props} />;
}
