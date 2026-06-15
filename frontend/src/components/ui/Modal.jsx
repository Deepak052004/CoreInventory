import { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Button } from './Button';

function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-in', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
export default Modal;
