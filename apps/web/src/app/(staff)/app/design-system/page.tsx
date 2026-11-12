import { PageHeader } from '@kmsdc/ui';
import Link from 'next/link';
import { DesignSystemShowcase } from './showcase';

export const metadata = { title: 'Design system' };

export default function DesignSystemPage() {
  return (
    <>
      <PageHeader
        title="Design system"
        description="Tokens and components shared by the public website and the staff workspace. Documented in docs/design/design-system.md."
        breadcrumbs={[{ label: 'Workspace', href: '/app' }, { label: 'Design system' }]}
        linkComponent={Link}
      />
      <DesignSystemShowcase />
    </>
  );
}
