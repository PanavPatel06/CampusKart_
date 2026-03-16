import { Card, CardContent } from './Card';
import Button from './Button';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
          CK
        </div>
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        {description ? (
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : null}
          {secondaryLabel ? (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

