import { ReactNode } from 'react';

interface CardProps {
  variant?: 'default' | 'flat' | 'elevated';
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default:  'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm',
  flat:     'bg-gray-50/60 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800',
  elevated: 'bg-white dark:bg-gray-900 shadow-lg border-0',
};

export default function Card({
  variant = 'default',
  title,
  action,
  children,
  className = '',
}: CardProps) {
  const hasHeader = title || action;

  return (
    <div className={`rounded-2xl transition-colors ${variantStyles[variant]} ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          {title && (
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {title}
            </h3>
          )}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
