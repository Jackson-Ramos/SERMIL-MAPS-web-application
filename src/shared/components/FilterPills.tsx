interface FilterOption<T extends string | number> {
  value: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string | number> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function FilterPills<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: FilterPillsProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`
              px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide
              transition-all duration-150 whitespace-nowrap
              ${
                active
                  ? 'bg-[#0B4F3A] text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#0B4F3A] dark:hover:border-[#28b88d] hover:text-[#0B4F3A] dark:hover:text-[#28b88d]'
              }
            `}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`ml-1.5 ${active ? 'opacity-70' : 'opacity-50'}`}>
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
