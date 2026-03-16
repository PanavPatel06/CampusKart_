import { cn } from './cn';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200/70 bg-white shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold tracking-tight text-gray-900', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn('mt-1 text-sm text-gray-600', className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('p-6 pt-0 flex items-center gap-2', className)}
      {...props}
    />
  );
}

