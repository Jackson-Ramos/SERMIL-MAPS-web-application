import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  startIcon,
  endIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {startIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full py-2.5 text-sm rounded-xl
            border bg-gray-50 dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:border-transparent
            transition-all duration-200
            ${error
              ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
              : 'border-gray-200 dark:border-gray-700 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d]'
            }
            ${startIcon ? 'pl-10' : 'pl-3'}
            ${endIcon ? 'pr-10' : 'pr-3'}
            ${className}
          `}
          {...props}
        />

        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            {endIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      )}
    </div>
  );
}
