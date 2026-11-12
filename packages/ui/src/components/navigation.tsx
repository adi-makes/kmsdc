import { ChevronRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
import { cn } from '../cn.js';

/** Router-agnostic link (pass Next.js `Link` from the app). */
export type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }
>;

const DefaultLink: LinkComponent = ({ children, ...props }) => <a {...props}>{children}</a>;

/* ------------------------------ Skip link ------------------------------ */

/** First focusable element on every page (WCAG 2.4.1). */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only z-100 rounded-md bg-primary px-4 py-2 font-medium text-primary-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {children}
    </a>
  );
}

/* ----------------------------- Breadcrumbs ----------------------------- */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  linkComponent: Link = DefaultLink,
  className,
}: {
  items: readonly BreadcrumbItem[];
  linkComponent?: LinkComponent;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${String(index)}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="rounded-sm hover:text-fg hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast && 'text-fg')}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="size-4 text-fg-subtle" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ----------------------------- Page header ----------------------------- */

/** Consistent top of every staff page: breadcrumbs, one h1, short description, actions. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  linkComponent,
  className,
}: {
  title: string;
  description?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
  linkComponent?: LinkComponent;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-3 pb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} {...(linkComponent ? { linkComponent } : {})} />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl leading-8 font-semibold text-fg">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-fg-muted">{description}</p> : null}
          {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
