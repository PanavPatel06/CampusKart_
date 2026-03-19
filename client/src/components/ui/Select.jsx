import { cn } from './cn';

export default function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-gray-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

