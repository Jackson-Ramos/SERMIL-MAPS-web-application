import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-md transition-colors ${className}`}>
      {title && <h3 className="mb-4 text-gray-900 dark:text-gray-100 font-medium">{title}</h3>}
      <div className="text-gray-800 dark:text-gray-200">
        {children}
      </div>
    </div>
  );
}
