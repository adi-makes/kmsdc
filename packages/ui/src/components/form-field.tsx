'use client';

import { CircleX } from 'lucide-react';
import { Label as LabelPrimitive } from 'radix-ui';
import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../cn.js';

export const Label = forwardRef<
  HTMLLabelElement,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn('text-sm leading-5 font-medium text-fg', className)}
      {...props}
    />
  );
});

/** Props handed to the control so label, hint and error are wired up for assistive tech. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
}

export interface FormFieldProps {
  label: ReactNode;
  /** Help text shown under the label. */
  description?: ReactNode;
  /** Validation message; when present the control is marked invalid. */
  error?: string | undefined;
  required?: boolean;
  /** Shows "(optional)" after the label for non-required fields in mostly-required forms. */
  showOptional?: boolean;
  className?: string;
  id?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Visible label + description + inline error (never placeholder-only labels).
 *
 * ```tsx
 * <FormField label="Phone" error={errors.phone?.message} required>
 *   {(field) => <Input {...field} {...register('phone')} />}
 * </FormField>
 * ```
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  showOptional = false,
  className,
  id: idProp,
  children,
}: FormFieldProps) {
  const generated = useId();
  const id = idProp ?? `field-${generated}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        ) : showOptional ? (
          <span className="font-normal text-fg-muted"> (optional)</span>
        ) : null}
      </Label>
      {description ? (
        <p id={descriptionId} className="text-sm text-fg-muted">
          {description}
        </p>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleX aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
