import { cn } from './cn';

const base =
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-gray-50';

const variants = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97]',
  secondary: 'bg-gray-700 text-white hover:bg-gray-800 active:scale-[0.97]',
  outline:   'border border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-900',
  ghost:     'hover:bg-gray-100 hover:text-gray-900 text-gray-700',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
};

const sizes = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5 text-base',
};

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

