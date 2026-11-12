'use client';

import {
  Alert,
  AppointmentStatusBadge,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  IntegrationModeBadge,
  Label,
  LoadingState,
  NativeSelect,
  Placeholder,
  SectionHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  toast,
} from '@kmsdc/ui';
import { APPOINTMENT_STATUSES } from '@kmsdc/types';
import {
  CalendarPlus,
  Download,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Printer,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

function Block({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-semibold">
          {title}
        </h2>
        {description ? <p className="max-w-3xl text-sm text-fg-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const SWATCHES: { group: string; tokens: { name: string; className: string; note?: string }[] }[] =
  [
    {
      group: 'Brand (provisional)',
      tokens: [
        { name: 'primary', className: 'bg-primary', note: 'buttons, links, focus' },
        { name: 'primary-hover', className: 'bg-primary-hover' },
        { name: 'primary-subtle', className: 'bg-primary-subtle' },
        { name: 'bg-inverse', className: 'bg-bg-inverse', note: 'footer, dark bands' },
        { name: 'whatsapp', className: 'bg-whatsapp', note: 'booking CTA only' },
      ],
    },
    {
      group: 'Surfaces & text',
      tokens: [
        { name: 'bg / surface', className: 'bg-surface' },
        { name: 'bg-app', className: 'bg-bg-app' },
        { name: 'bg-muted', className: 'bg-bg-muted' },
        { name: 'border-strong', className: 'bg-border-strong' },
        { name: 'fg-muted', className: 'bg-fg-muted' },
        { name: 'fg', className: 'bg-fg' },
      ],
    },
    {
      group: 'Status',
      tokens: [
        { name: 'success', className: 'bg-success' },
        { name: 'warning', className: 'bg-warning' },
        { name: 'danger', className: 'bg-danger' },
        { name: 'info', className: 'bg-info' },
        { name: 'accent', className: 'bg-accent' },
      ],
    },
  ];

const TYPE_SCALE = [
  {
    label: 'Display / 6xl',
    className: 'font-heading text-6xl font-semibold',
    sample: 'Gentle dental care',
  },
  {
    label: 'H1 / 4xl',
    className: 'font-heading text-4xl font-semibold',
    sample: 'Root canal treatment',
  },
  {
    label: 'H2 / 2xl',
    className: 'font-heading text-2xl font-semibold',
    sample: "Today's appointments",
  },
  { label: 'H3 / lg', className: 'font-heading text-lg font-semibold', sample: 'Treatment plan' },
  {
    label: 'Body / base',
    className: 'text-base',
    sample: 'Body text is 16px with a 24px line height for comfortable reading.',
  },
  {
    label: 'Small / sm',
    className: 'text-sm',
    sample: 'Secondary text, table cells and form help.',
  },
  {
    label: 'Caption / xs',
    className: 'text-xs text-fg-muted',
    sample: 'Metadata only — never body copy.',
  },
];

export function DesignSystemShowcase() {
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const phoneError =
    phone.length > 0 && !/^\+?[0-9 ]{10,14}$/.test(phone)
      ? 'Enter a valid Indian phone number'
      : undefined;

  return (
    <div className="flex flex-col gap-10 pb-16">
      <Alert tone="warning" title="Provisional brand palette">
        Colours and the &ldquo;K&rdquo; mark are placeholders until the clinic&rsquo;s logo, colours
        and fonts are supplied. Changing the brand primitives in{' '}
        <code>packages/ui/src/styles.css</code> updates every component.
      </Alert>

      <Block
        id="ds-colors"
        title="Colour tokens"
        description="Components use semantic tokens only. Every text pair meets WCAG AA (4.5:1); checked by scripts/check-contrast.py."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {SWATCHES.map((group) => (
            <div key={group.group} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-fg-muted">{group.group}</h3>
              <ul className="flex flex-col gap-2">
                {group.tokens.map((token) => (
                  <li key={token.name} className="flex items-center gap-3">
                    <span
                      className={`size-9 shrink-0 rounded-md border border-border ${token.className}`}
                    />
                    <span className="flex flex-col">
                      <code className="text-sm">{token.name}</code>
                      {token.note ? (
                        <span className="text-xs text-fg-muted">{token.note}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block
        id="ds-type"
        title="Typography"
        description="Figtree for headings, Noto Sans for body (Noto also covers Malayalam for future localisation). Self-hosted via next/font."
      >
        <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 px-5 py-4 md:flex-row md:items-baseline md:gap-6"
            >
              <dt className="w-36 shrink-0 text-xs text-fg-muted">{row.label}</dt>
              <dd className={`min-w-0 ${row.className}`}>{row.sample}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block
        id="ds-buttons"
        title="Buttons"
        description="One primary action per view. Destructive actions use danger and always confirm. Icon-only buttons require a label."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">Link</Button>
          <Button variant="whatsapp" leadingIcon={<MessageCircle aria-hidden="true" />}>
            Book on WhatsApp
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button leadingIcon={<CalendarPlus aria-hidden="true" />}>New appointment</Button>
          <Button
            loading={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
              }, 1500);
            }}
          >
            {busy ? 'Saving…' : 'Click to load'}
          </Button>
          <Button disabled>Disabled</Button>
          <Tooltip content="Print receipt">
            <IconButton
              label="Print receipt"
              icon={<Printer aria-hidden="true" />}
              variant="secondary"
            />
          </Tooltip>
        </div>
      </Block>

      <Block
        id="ds-forms"
        title="Form controls"
        description="Visible labels, help text above the field, errors inline below with an icon. Controls are 44px tall on touch screens."
      >
        <Card>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <FormField label="Full name" required>
              {(field) => <Input {...field} placeholder="As on ID" autoComplete="name" />}
            </FormField>
            <FormField
              label="Phone"
              description="Try typing letters to see the error state."
              error={phoneError}
              required
            >
              {(field) => (
                <Input
                  {...field}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField label="Preferred dentist" showOptional>
              {(field) => (
                <NativeSelect {...field} defaultValue="">
                  <option value="">No preference</option>
                  <option value="a">Sample option A</option>
                </NativeSelect>
              )}
            </FormField>
            <FormField label="Appointment type">
              {(field) => (
                <Select>
                  <SelectTrigger id={field.id} aria-describedby={field['aria-describedby']}>
                    <SelectValue placeholder="Choose a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consult">Consultation</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField label="Notes for reception" className="md:col-span-2" showOptional>
              {(field) => (
                <Textarea {...field} placeholder="Do not include medical details here." />
              )}
            </FormField>
            <div className="flex items-start gap-3">
              <Checkbox id="ds-consent" />
              <Label htmlFor="ds-consent" className="font-normal">
                I agree to be contacted about this enquiry by phone or WhatsApp.
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ds-switch" defaultChecked />
              <Label htmlFor="ds-switch" className="font-normal">
                Send appointment reminders
              </Label>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="secondary">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </Block>

      <Block
        id="ds-status"
        title="Badges & status"
        description="Status always combines colour, icon and text. Mock integrations are always labelled."
      >
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_STATUSES.map((s) => (
            <AppointmentStatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <IntegrationModeBadge mode="mock" />
          <IntegrationModeBadge mode="live" />
          <IntegrationModeBadge mode="unavailable" />
          <Badge tone="brand">New patient</Badge>
          <Badge tone="danger">Allergy: penicillin (sample)</Badge>
        </div>
      </Block>

      <Block
        id="ds-table"
        title="Data table"
        description="Readable rows, tabular numbers, row actions in a menu. Scrolls inside its container on small screens."
      >
        <TableContainer label="Sample appointments">
          <Table>
            <TableCaption>
              Synthetic sample rows for design review — not real patients.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Chair</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                [
                  ['09:30', '[TEST] Patient A', 'Consultation', 'Chair 1', 'CONFIRMED'],
                  ['10:15', '[TEST] Patient B', 'Follow-up', 'Chair 2', 'CHECKED_IN'],
                  ['11:00', '[TEST] Patient C', 'Procedure', 'Chair 1', 'REQUESTED'],
                ] as const
              ).map(([time, name, type, chair, status]) => (
                <TableRow key={time}>
                  <TableCell className="tabular font-medium">{time}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-fg-muted">{type}</TableCell>
                  <TableCell className="text-fg-muted">{chair}</TableCell>
                  <TableCell>
                    <AppointmentStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          size="icon-sm"
                          label={`Actions for ${name}`}
                          icon={<MoreHorizontal aria-hidden="true" />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Appointment</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Pencil aria-hidden="true" /> Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download aria-hidden="true" /> Download summary
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive>
                          <Trash2 aria-hidden="true" /> Cancel appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Block>

      <Block id="ds-overlays" title="Tabs, dialogs, drawers & toasts">
        <Tabs defaultValue="overview">
          <TabsList aria-label="Sample patient sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-fg-muted">
            Tabs organise a record into sections instead of one long page.
          </TabsContent>
          <TabsContent value="appointments" className="text-sm text-fg-muted">
            Appointments panel.
          </TabsContent>
          <TabsContent value="clinical" className="text-sm text-fg-muted">
            Clinical panel.
          </TabsContent>
          <TabsContent value="billing" className="text-sm text-fg-muted">
            Billing panel.
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger">Cancel appointment…</Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Cancel this appointment?</DialogTitle>
                <DialogDescription>
                  The slot is released and, if enabled, a cancellation message is sent. This cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Keep appointment</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger">Cancel appointment</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" leadingIcon={<Users aria-hidden="true" />}>
                Open drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Quick patient view</DrawerTitle>
                <DrawerDescription>Drawers keep context while showing details.</DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
              <DrawerFooter className="mt-auto">
                <Button>Open full profile</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Button
            variant="secondary"
            onClick={() => {
              toast.success('Appointment confirmed', {
                description: 'Sample toast — nothing was saved.',
              });
            }}
          >
            Show toast
          </Button>
        </div>
      </Block>

      <Block id="ds-alerts" title="Alerts">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="info" title="Information">
            Reminders are sent the day before at 10:00.
          </Alert>
          <Alert tone="success" title="Saved">
            Patient details updated.
          </Alert>
          <Alert tone="warning" title="Mock mode">
            Messages are simulated and not delivered.
          </Alert>
          <Alert tone="danger" title="Slot unavailable">
            The dentist already has an appointment at 10:15.
          </Alert>
        </div>
      </Block>

      <Block
        id="ds-states"
        title="Empty, loading and error states"
        description="Every async view shows one of these instead of a blank area."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            icon={Search}
            title="No patients match"
            description="Check the spelling or search by phone number."
            action={
              <Button size="sm" variant="secondary">
                Clear search
              </Button>
            }
          />
          <Card className="flex items-center justify-center">
            <LoadingState label="Loading appointments…" />
          </Card>
          <ErrorState
            onRetry={() => {
              toast('Retrying… (sample)');
            }}
          />
        </div>
      </Block>

      <Block
        id="ds-public"
        title="Public website language"
        description="More whitespace, larger type, fewer borders. Missing clinic information is shown as an explicit placeholder — never invented."
      >
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-bg px-6 py-10 sm:px-10">
          <SectionHeader
            eyebrow="Pathanamthitta, Kerala"
            title="Dental care for the whole family"
            description="Sample hero copy for design review. Final wording will use only verified clinic information."
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="whatsapp" size="lg" leadingIcon={<MessageCircle aria-hidden="true" />}>
              Book on WhatsApp
            </Button>
            <Button variant="secondary" size="lg">
              View services
            </Button>
          </div>
          <p className="text-sm text-fg-muted">
            Opening hours: <Placeholder>opening hours</Placeholder>
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {['General dentistry', 'Root canal treatment', 'Dental implants'].map((s) => (
              <Card key={s} className="border-transparent bg-bg-subtle shadow-none">
                <CardHeader>
                  <CardTitle>{s}</CardTitle>
                  <CardDescription>
                    Service card with short, plain-language description.
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Block>
    </div>
  );
}
