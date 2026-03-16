import { cn } from './cn';

const variants = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-indigo-50 text-indigo-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
};

export default function Badge({ className, variant = 'neutral', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

