import { Button, cn } from '@kmsdc/ui';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { bookingLink } from '@/lib/site';

/**
 * Primary booking call-to-action. Uses the configured WhatsApp number with a prefilled
 * message. When no number is configured it never fabricates a link: it points visitors to
 * the enquiry form instead and says why.
 */
export function BookingCta({
  serviceName,
  size = 'lg',
  className,
  showFallbackNote = true,
}: {
  serviceName?: string;
  size?: 'md' | 'lg';
  className?: string;
  showFallbackNote?: boolean;
}) {
  const href = bookingLink(serviceName);
  if (href) {
    return (
      <Button asChild variant="whatsapp" size={size} className={className}>
        <a href={href} target="_blank" rel="noopener noreferrer" data-analytics="whatsapp_click">
          <MessageCircle aria-hidden="true" />
          Book on WhatsApp
          <span className="sr-only"> (opens WhatsApp)</span>
        </a>
      </Button>
    );
  }
  return (
    <div className={cn('flex flex-col items-stretch gap-1.5 sm:items-start', className)}>
      <Button asChild variant="primary" size={size}>
        <Link href="/contact#enquiry">Send an enquiry</Link>
      </Button>
      {showFallbackNote ? (
        <p className="text-xs text-fg-muted">WhatsApp booking will be available here soon.</p>
      ) : null}
    </div>
  );
}
