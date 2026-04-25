import { ReactNode } from 'react';

export type BadgeVariant =
  | 'ativa'
  | 'encerrada'
  | 'expirada'
  | 'admin'
  | 'porteiro'
  | 'morador'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'brand'
  | 'active'
  | 'inactive';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const colorMap: Record<BadgeVariant, string> = {
  ativa:     'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  encerrada: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  expirada:  'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  admin:     'bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d]',
  porteiro:  'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  morador:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  success:   'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  danger:    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  neutral:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  brand:     'bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d]',
  active:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  inactive:  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const dotMap: Record<BadgeVariant, string> = {
  ativa:     'bg-green-500 animate-pulse',
  encerrada: 'bg-gray-400',
  expirada:  'bg-red-500',
  admin:     'bg-[#0B4F3A] dark:bg-[#28b88d]',
  porteiro:  'bg-blue-500',
  morador:   'bg-amber-500',
  success:   'bg-green-500',
  warning:   'bg-amber-500',
  danger:    'bg-red-500',
  neutral:   'bg-gray-400',
  brand:     'bg-[#0B4F3A] dark:bg-[#28b88d]',
  active:    'bg-green-500 animate-pulse',
  inactive:  'bg-gray-400',
};

export default function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        text-[10px] font-bold uppercase tracking-wide whitespace-nowrap
        ${colorMap[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotMap[variant]}`} />
      )}
      {children}
    </span>
  );
}
