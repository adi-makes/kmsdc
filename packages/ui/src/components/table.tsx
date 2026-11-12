import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '../cn.js';

/**
 * Data table primitives. The wrapper scrolls horizontally on small screens instead of
 * breaking the page layout; give the table a caption (visible or sr-only).
 */
export function TableContainer({
  className,
  label,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** Names the scrollable region for keyboard and screen-reader users (WCAG 2.1.1). */
  label: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      // Focusable so keyboard users can scroll wide tables horizontally.
      tabIndex={0}
      className={cn(
        'relative w-full overflow-x-auto rounded-lg border border-border bg-surface',
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
  );
}

export function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption className={cn('px-4 py-3 text-left text-sm text-fg-muted', className)} {...props} />
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-bg-subtle', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-bg-subtle data-[state=selected]:bg-primary-subtle',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  scope = 'col',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-fg-muted uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}
