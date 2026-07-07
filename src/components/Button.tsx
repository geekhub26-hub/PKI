import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  loading = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-emerald-800 text-white hover:bg-emerald-700 focus:ring-emerald-600 shadow-sm hover:shadow-md rounded-full',
    secondary: 'border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 rounded-full',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md rounded-full',
    success: 'bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm hover:shadow-md rounded-full',
    outline: 'border-2 border-emerald-800 text-emerald-800 hover:bg-emerald-50 focus:ring-emerald-600 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-full',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        loading && 'cursor-wait',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} className="animate-spin" />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
}
