import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Card = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
  <div {...rest} className={cn('bg-white border border-zinc-200 rounded-xl p-6 shadow-sm', className)}>
    {children}
  </div>
);

export const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'blocked';
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    blocked: 'bg-rose-50 text-rose-700 border border-rose-100',
  };
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        variants[variant],
      )}
    >
      {children}
    </span>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  wide,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100">
          <h3 className="text-lg font-serif italic text-zinc-900">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
};

export const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  indent,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg group',
      indent && 'pl-8',
      active ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
    )}
  >
    <Icon
      size={16}
      className={cn(active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900')}
    />
    {label}
  </button>
);

export const SidebarGroup = ({ label }: { label: string }) => (
  <p className="px-4 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 select-none">
    {label}
  </p>
);

export const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{label}</label>
    {children}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={cn(
        'w-full bg-zinc-50 rounded-lg px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300 border border-zinc-100',
        className,
      )}
    />
  ),
);
Input.displayName = 'Input';

export const Select = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      'w-full bg-zinc-50 rounded-lg px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300 border border-zinc-100',
      className,
    )}
  >
    {children}
  </select>
);

export const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      'w-full bg-zinc-50 rounded-lg px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300 border border-zinc-100 font-mono resize-none',
      className,
    )}
  />
);

export const Btn = ({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) => {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    ghost: 'bg-transparent text-zinc-500 hover:text-zinc-900',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button
      {...props}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
};
