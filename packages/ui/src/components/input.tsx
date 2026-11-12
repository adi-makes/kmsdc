import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn.js';

/** Shared control styling; `aria-invalid` drives the error appearance. */
export const controlClasses = cn(
  'w-full rounded-md border border-border-strong bg-surface px-3 text-base text-fg shadow-xs sm:text-sm',
  'placeholder:text-fg-subtle',
  'transition-colors duration-150 hover:border-neutral-400',
  'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
  'disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-fg-muted',
  'aria-invalid:border-danger aria-invalid:focus-visible:outline-danger',
);

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  // 16px text on mobile prevents iOS zoom-on-focus; 14px from `sm` up.
  return (
    <input
      ref={ref}
      type={type}
      className={cn(controlClasses, 'h-11 sm:h-10', className)}
      {...props}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses, 'min-h-24 py-2 leading-6', className)}
      {...props}
    />
  );
});
