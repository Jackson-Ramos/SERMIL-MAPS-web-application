interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-10 w-10 border-2',
  lg: 'h-14 w-14 border-[3px]',
};

export default function Loading({ size = 'md', label, fullPage = false }: LoadingProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          animate-spin rounded-full
          border-gray-200 dark:border-gray-700
          border-t-[#0B4F3A] dark:border-t-[#28b88d]
          ${sizeMap[size]}
        `}
      />
      {label && (
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">{spinner}</div>
  );
}
