'use client';

import { Menu, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '../cn.js';
import { IconButton } from './button.js';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from './dialog.js';
import { SkipLink, type LinkComponent } from './navigation.js';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional count (e.g. unread conversations) — announced with its label. */
  badge?: number;
}

export interface NavSection {
  label?: string;
  items: readonly NavItem[];
}

const DefaultLink: LinkComponent = ({ children, ...props }) => <a {...props}>{children}</a>;

function NavList({
  sections,
  activeHref,
  Link,
  onNavigate,
}: {
  sections: readonly NavSection[];
  activeHref: string;
  Link: LinkComponent;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {sections.map((section, sectionIndex) => (
        <div
          key={section.label ?? `section-${String(sectionIndex)}`}
          className="flex flex-col gap-0.5"
        >
          {section.label ? (
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
              {section.label}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active =
                activeHref === item.href ||
                (item.href !== '/app' && activeHref.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-subtle text-primary-subtle-fg'
                        : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn('size-5 shrink-0', active && 'text-fg-brand')}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs leading-none font-semibold text-primary-fg tabular">
                        {item.badge}
                        <span className="sr-only"> unread</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export interface AppShellProps {
  brand: ReactNode;
  sections: readonly NavSection[];
  activeHref: string;
  /** Right side of the top bar: search, notifications, user menu. */
  topBar?: ReactNode;
  /** Persistent environment notice (e.g. "Development — synthetic data only"). */
  banner?: ReactNode;
  sidebarFooter?: ReactNode;
  linkComponent?: LinkComponent;
  children: ReactNode;
}

/**
 * Staff application frame: fixed sidebar ≥ lg, drawer navigation below. One `<main>`
 * landmark with the skip-link target.
 */
export function AppShell({
  brand,
  sections,
  activeHref,
  topBar,
  banner,
  sidebarFooter,
  linkComponent: Link = DefaultLink,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // The Drawer root wraps the layout so the menu button is a real DrawerTrigger: Radix then
  // returns focus to it when the drawer closes (WCAG 2.4.3).
  return (
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="min-h-dvh bg-bg-app">
        <SkipLink />
        {banner}
        <div className="flex">
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
            <div className="flex h-16 items-center border-b border-border px-5">{brand}</div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList sections={sections} activeHref={activeHref} Link={Link} />
            </div>
            {sidebarFooter ? (
              <div className="border-t border-border p-3">{sidebarFooter}</div>
            ) : null}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
              <DrawerTrigger asChild>
                <IconButton
                  className="lg:hidden"
                  label="Open navigation"
                  icon={<Menu aria-hidden="true" />}
                />
              </DrawerTrigger>
              <div className="lg:hidden">{brand}</div>
              <div className="ml-auto flex items-center gap-2">{topBar}</div>
            </header>
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
            >
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>

        <DrawerContent side="left" className="p-0" aria-describedby={undefined}>
          <div className="flex h-16 items-center border-b border-border px-5">
            <DrawerTitle className="sr-only">Navigation</DrawerTitle>
            {brand}
          </div>
          <div className="flex-1 px-3 py-2">
            <NavList
              sections={sections}
              activeHref={activeHref}
              Link={Link}
              onNavigate={() => {
                setMobileOpen(false);
              }}
            />
          </div>
          {sidebarFooter ? <div className="border-t border-border p-3">{sidebarFooter}</div> : null}
        </DrawerContent>
      </div>
    </Drawer>
  );
}
