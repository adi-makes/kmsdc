import {
  Badge,
  PageHeader,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@kmsdc/ui';
import { CircleCheck, CircleDashed } from 'lucide-react';
import Link from 'next/link';
import { getSetupChecklist } from '@/content/setup-checklist';

export const metadata = { title: 'Setup checklist' };

export default function SetupChecklistPage() {
  const items = getSetupChecklist();
  const done = items.filter((i) => i.done).length;
  return (
    <>
      <PageHeader
        title="Setup checklist"
        description="Information the clinic still needs to supply. Nothing on the public website is invented — missing items are hidden or shown as placeholders."
        breadcrumbs={[{ label: 'Workspace', href: '/app' }, { label: 'Setup checklist' }]}
        linkComponent={Link}
        meta={
          <Badge tone={done === items.length ? 'success' : 'warning'}>
            {done} of {items.length} complete
          </Badge>
        }
      />
      <TableContainer label="Setup checklist">
        <Table>
          <TableCaption>
            Values are edited in apps/web/src/content/clinic-profile.ts (moves to Settings in a
            later phase).
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Website behaviour while missing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="text-fg-muted">{item.group}</TableCell>
                <TableCell>
                  {item.done ? (
                    <Badge tone="success">
                      <CircleCheck aria-hidden="true" /> Done
                    </Badge>
                  ) : (
                    <Badge tone="warning">
                      <CircleDashed aria-hidden="true" /> Needed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-fg-muted">
                  {item.done ? '—' : item.whileMissing}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
