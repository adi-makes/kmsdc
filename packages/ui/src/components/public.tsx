import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn.js';

/*
 * Public-website layout primitives. The public site uses more whitespace, larger type
 * and fewer borders than the staff app; these keep that rhythm consistent.
 */

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8', className)} {...props} />;
}

const sectionVariants = cva('py-16 sm:py-24', {
  variants: {
    tone: {
      default: 'bg-bg',
      subtle: 'bg-bg-subtle',
      brand: 'bg-bg-brand-subtle',
      inverse: 'bg-bg-inverse text-fg-inverse',
    },
  },
  defaultVariants: { tone: 'default' },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

export function Section({ className, tone, ...props }: SectionProps) {
  return <section className={cn(sectionVariants({ tone }), className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  id,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex max-w-2xl flex-col gap-3',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-fg-brand uppercase">{eyebrow}</p>
      ) : null}
      <Heading
        id={id}
        className={cn(
          'font-heading font-semibold text-balance text-current',
          Heading === 'h1' ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-3xl sm:text-4xl',
        )}
      >
        {title}
      </Heading>
      {description ? <p className="text-lg leading-8 text-fg-muted">{description}</p> : null}
    </div>
  );
}

/** Clearly labelled stand-in for information the clinic has not supplied yet. */
export function Placeholder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-dashed border-warning-border bg-warning-bg px-2 py-0.5 text-sm text-warning',
        className,
      )}
    >
      <span className="font-semibold">To be confirmed:</span> {children}
    </span>
  );
}
