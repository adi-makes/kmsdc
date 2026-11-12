'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from 'react';
import { cn } from '../cn.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay() {
  return <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />;
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      className="absolute top-3 right-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-bg-muted hover:text-fg"
      aria-label="Close"
    >
      <X aria-hidden="true" className="size-5" />
    </DialogPrimitive.Close>
  );
}

/**
 * Modal dialog: focus is trapped, Escape closes, focus returns to the trigger.
 * Always render a DialogTitle (use `sr-only` if it must be hidden).
 */
export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: 'sm' | 'md' | 'lg' }
>(function DialogContent({ className, children, size = 'md', ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto',
          'rounded-lg border border-border bg-surface-raised p-6 shadow-lg animate-pop-in',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-3xl',
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-fg-muted', className)}
      {...props}
    />
  );
});

/* ---------- Drawer (side sheet) — same accessibility contract as Dialog ---------- */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogTitle;
export const DrawerDescription = DialogDescription;
export const DrawerHeader = DialogHeader;
export const DrawerFooter = DialogFooter;

const drawerVariants = cva(
  'fixed inset-y-0 z-50 flex h-dvh w-full flex-col gap-4 overflow-y-auto border-border bg-surface-raised p-6 shadow-lg',
  {
    variants: {
      side: {
        right: 'right-0 border-l animate-slide-in-right sm:max-w-md',
        left: 'left-0 border-r animate-slide-in-left sm:max-w-xs',
      },
      width: { default: '', wide: 'sm:max-w-2xl' },
    },
    defaultVariants: { side: 'right', width: 'default' },
  },
);

export const DrawerContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & VariantProps<typeof drawerVariants>
>(function DrawerContent({ className, children, side, width, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(drawerVariants({ side, width }), className)}
        {...props}
      >
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
