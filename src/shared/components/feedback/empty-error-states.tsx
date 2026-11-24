import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border bg-card/60 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <Inbox aria-hidden="true" className="text-muted-foreground mb-4 size-8" />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'border-destructive/30 bg-destructive/5 flex min-h-48 flex-col items-center justify-center rounded-xl border px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="text-destructive mb-4 size-8" />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          <RotateCcw aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
