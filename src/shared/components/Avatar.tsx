interface AvatarProps {
  name: string;
  role?: 'admin' | 'porteiro' | 'morador';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const roleColors = {
  admin:    'bg-[#0B4F3A]',
  porteiro: 'bg-blue-500',
  morador:  'bg-amber-500',
};

const sizeStyles = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Avatar({ name, role, size = 'md', className = '' }: AvatarProps) {
  const color = role ? roleColors[role] : 'bg-gray-500';

  return (
    <div
      title={name}
      className={`
        ${sizeStyles[size]} ${color}
        rounded-full flex items-center justify-center
        text-white font-bold flex-shrink-0 select-none
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}
