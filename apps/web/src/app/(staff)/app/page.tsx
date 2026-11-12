import { EmptyState, PageHeader } from '@kmsdc/ui';
import { CalendarDays } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's appointments, requests, conversations and alerts will appear here."
      />
      <EmptyState
        icon={CalendarDays}
        title="Nothing to show yet"
        description="The dashboard fills in as patients, appointments, billing and messaging are added in the next phases."
      />
    </>
  );
}
