'use client';

import { CircleX, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { cn } from '../cn.js';
import { Button } from './button.js';

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, contact the clinic administrator.',
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-danger-border bg-danger-bg px-6 py-10 text-center',
        className,
      )}
    >
      <CircleX aria-hidden="true" className="size-8 text-danger" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold text-danger">{title}</p>
        <p className="text-sm text-fg">{description}</p>
      </div>
      {onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leadingIcon={<RefreshCw aria-hidden="true" />}
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------- Toasts -------------------------------- */

/** Mount once near the root. Toasts are announced politely and never hold the only copy of an error. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-surface-raised text-fg shadow-md font-sans',
          description: 'text-fg-muted',
        },
      }}
    />
  );
}

export { toast };
