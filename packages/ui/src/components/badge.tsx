import type { AppointmentStatus, IntegrationMode } from '@kmsdc/types';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Ban,
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  CircleDot,
  FlaskConical,
  PlugZap,
  Repeat,
  UserCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '../cn.js';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-4 font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-bg-muted text-fg-muted',
        brand: 'border-border-brand bg-primary-subtle text-primary-subtle-fg',
        success: 'border-success-border bg-success-bg text-success',
        warning: 'border-warning-border bg-warning-bg text-warning',
        danger: 'border-danger-border bg-danger-bg text-danger',
        info: 'border-info-border bg-info-bg text-info',
        accent: 'border-accent-border bg-accent-bg text-accent',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * Status always pairs colour with an icon and a text label — never colour alone.
 */
const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; tone: BadgeTone; icon: LucideIcon }
> = {
  REQUESTED: { label: 'Requested', tone: 'warning', icon: CalendarClock },
  CONFIRMED: { label: 'Confirmed', tone: 'brand', icon: CalendarCheck },
  CHECKED_IN: { label: 'Checked in', tone: 'info', icon: UserCheck },
  IN_PROGRESS: { label: 'In progress', tone: 'accent', icon: CircleDot },
  COMPLETED: { label: 'Completed', tone: 'success', icon: CircleCheck },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: Ban },
  NO_SHOW: { label: 'No-show', tone: 'danger', icon: UserX },
  RESCHEDULED: { label: 'Rescheduled', tone: 'neutral', icon: Repeat },
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_META[status].label;
}

export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const meta = APPOINTMENT_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={className}>
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

const INTEGRATION_MODE_META: Record<
  IntegrationMode,
  { label: string; tone: BadgeTone; icon: LucideIcon; title: string }
> = {
  mock: {
    label: 'Mock mode',
    tone: 'warning',
    icon: FlaskConical,
    title: 'Simulated — nothing is actually sent or published.',
  },
  live: { label: 'Live', tone: 'success', icon: PlugZap, title: 'Connected to the real service.' },
  unavailable: {
    label: 'Not connected',
    tone: 'neutral',
    icon: Ban,
    title: 'This integration is not configured.',
  },
};

/** Makes mock integrations impossible to mistake for real ones (ADR-010). */
export function IntegrationModeBadge({
  mode,
  className,
}: {
  mode: IntegrationMode;
  className?: string;
}) {
  const meta = INTEGRATION_MODE_META[mode];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} title={meta.title} className={className}>
      <Icon aria-hidden="true" />
      {meta.label}
      <span className="sr-only">: {meta.title}</span>
    </Badge>
  );
}
