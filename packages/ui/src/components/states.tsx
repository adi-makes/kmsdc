import { cva, type VariantProps } from 'class-variance-authority';
import { CircleCheck, CircleX, Inbox, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn.js';
import { Spinner } from './spinner.js';

/* Server-safe (no 'use client'): these can receive icon components from Server Components. */

/* -------------------------------- Alert -------------------------------- */

const alertVariants = cva(
  'flex gap-3 rounded-lg border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      tone: {
        info: 'border-info-border bg-info-bg text-info',
        success: 'border-success-border bg-success-bg text-success',
        warning: 'border-warning-border bg-warning-bg text-warning',
        danger: 'border-danger-border bg-danger-bg text-danger',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

const ALERT_ICONS: Record<'info' | 'success' | 'warning' | 'danger', LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX,
};

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  title?: ReactNode;
  /** Interrupts screen readers — use only for errors that need immediate attention. */
  assertive?: boolean;
}

export function Alert({
  tone = 'info',
  title,
  assertive = false,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = ALERT_ICONS[tone ?? 'info'];
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-fg">{children}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------- Skeleton ------------------------------- */

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-bg-muted', className)}
      {...props}
    />
  );
}

/* ------------------------- Empty / Loading / Error ------------------------ */

interface StateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

/** Explains why nothing is shown and what to do next. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-bg-muted text-fg-muted">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 py-12 text-sm text-fg-muted',
        className,
      )}
    >
      <Spinner className="size-5" />
      <span>{label}</span>
    </div>
  );
}
