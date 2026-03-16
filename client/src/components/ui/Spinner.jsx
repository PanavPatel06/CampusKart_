import { cn } from './cn';

export default function Spinner({ className, ...props }) {
  return (
    <div
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700',
        className,
      )}
      aria-label="Loading"
      role="status"
      {...props}
    />
  );
}

