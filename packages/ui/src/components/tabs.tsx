'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react';
import { cn } from '../cn.js';

export const Tabs = TabsPrimitive.Root;

/** Underline tabs — used for record sections (e.g. patient profile). Scrolls on small screens. */
export const TabsList = forwardRef<
  ComponentRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex w-full gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]',
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef<
  ComponentRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        '-mb-px inline-flex h-11 cursor-pointer items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-fg-muted',
        'transition-colors hover:text-fg data-[state=active]:border-primary data-[state=active]:text-fg-brand',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  ComponentRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('pt-5', className)} {...props} />;
});
