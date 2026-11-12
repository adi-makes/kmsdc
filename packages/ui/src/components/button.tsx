import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn.js';
import { Spinner } from './spinner.js';

/**
 * Button hierarchy (docs/design/design-system.md §Buttons):
 *  - primary   — the one main action in a view
 *  - secondary — alternative actions
 *  - ghost     — low-emphasis / toolbar actions
 *  - subtle    — brand-tinted secondary (filters, quick actions)
 *  - danger    — destructive, always paired with confirmation
 *  - whatsapp  — public-site booking CTA only
 *  - link      — inline navigation styled as a button
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap',
    'transition-colors duration-150 ease-(--ease-standard)',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg shadow-xs hover:bg-primary-hover',
        secondary:
          'border border-border-strong bg-surface text-fg shadow-xs hover:border-neutral-400 hover:bg-bg-subtle',
        ghost: 'text-fg hover:bg-bg-muted',
        subtle: 'bg-brand-100 text-brand-800 hover:bg-brand-200',
        danger: 'bg-danger-solid text-white shadow-xs hover:bg-danger',
        whatsapp: 'bg-whatsapp text-white shadow-sm hover:bg-whatsapp-hover',
        link: 'h-auto px-0 text-fg-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
        'icon-sm': 'size-9 [&_svg]:size-4',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a Next.js Link) with button styles. */
  asChild?: boolean;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    leadingIcon,
    disabled,
    children,
    type,
    ...props
  },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot.Root ref={ref} className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={classes}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends Omit<
  ButtonProps,
  'size' | 'leadingIcon' | 'children' | 'aria-label'
> {
  /** Required: icon-only buttons must have an accessible name. Also shown as a tooltip by callers. */
  label: string;
  icon: ReactNode;
  size?: 'icon' | 'icon-sm';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = 'icon', variant = 'ghost', ...props },
  ref,
) {
  return (
    <Button ref={ref} size={size} variant={variant} aria-label={label} {...props}>
      {icon}
    </Button>
  );
});
