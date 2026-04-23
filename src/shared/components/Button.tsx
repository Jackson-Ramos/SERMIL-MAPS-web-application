import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded transition-colors min-h-[48px]';

  const variantStyles = {
    primary: 'bg-[#0B4F3A] text-white hover:bg-[#0a3f2f] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-md hover:shadow-lg',
    secondary: 'bg-white dark:bg-gray-800 text-[#0B4F3A] dark:text-[#28b88d] border border-[#0B4F3A] dark:border-[#28b88d] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
