import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs min-h-[32px] gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm min-h-[40px] gap-2 rounded-xl',
  lg: 'px-5 py-3 text-sm min-h-[48px] gap-2 rounded-xl',
};

const variantStyles = {
  primary:
    'bg-[#0B4F3A] text-white hover:bg-[#0a3f2f] active:bg-[#073627] focus:ring-[#0B4F3A] shadow-md hover:shadow-lg disabled:bg-gray-300 dark:disabled:bg-gray-700',
  secondary:
    'bg-white dark:bg-gray-900 text-[#0B4F3A] dark:text-[#28b88d] border border-[#0B4F3A]/25 dark:border-[#28b88d]/25 hover:bg-[#0B4F3A]/5 dark:hover:bg-[#28b88d]/5 focus:ring-[#0B4F3A] shadow-sm hover:shadow-md',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-md hover:shadow-lg disabled:bg-gray-300',
  ghost:
    'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300 dark:focus:ring-gray-700',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold tracking-wide
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950
        disabled:opacity-60 disabled:cursor-not-allowed
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
