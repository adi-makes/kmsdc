import { LoaderCircle } from 'lucide-react';
import { cn } from '../cn.js';

export interface SpinnerProps {
  className?: string;
  /** Accessible label. Omit when the surrounding element already announces the busy state. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex items-center">
      <LoaderCircle aria-hidden="true" className={cn('size-4 animate-spin', className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
