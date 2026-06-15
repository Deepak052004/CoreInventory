import { clsx } from 'clsx';

export function Button({ children, variant = 'primary', size = 'md', className, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    outline: 'border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
