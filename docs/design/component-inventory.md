# Component inventory (`@kmsdc/ui`)

Live examples: `/app/design-system`. Files are in `packages/ui/src/components/`. "Client" means the
module has `'use client'` (interactive). Server-safe components can receive icon components from
React Server Components.

| Component                                                 | File           | Client | Variants / props                                              | Accessibility notes                                                    |
| --------------------------------------------------------- | -------------- | ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Button`                                                  | button.tsx     | –      | variant ×7, size sm/md/lg/icon/icon-sm, `loading`, `asChild`  | Defaults to `type="button"`. `aria-busy` while loading                 |
| `IconButton`                                              | button.tsx     | –      | `label` (required), `icon`                                    | `label` becomes `aria-label`                                           |
| `Spinner`                                                 | spinner.tsx    | –      | `label`                                                       | `role="status"` only when labelled                                     |
| `Input`, `Textarea`                                       | input.tsx      | –      | native props                                                  | `aria-invalid` styling. 16px text on mobile                            |
| `Label`, `FormField`                                      | form-field.tsx | ✓      | `label`, `description`, `error`, `required`, `showOptional`   | Wires id / describedby / invalid / required                            |
| `NativeSelect`, `Select*`                                 | select.tsx     | ✓      | Radix Select parts                                            | Native preferred on mobile                                             |
| `Checkbox`, `Switch`                                      | checkbox.tsx   | ✓      | Radix                                                         | Pair with a `<Label htmlFor>`                                          |
| `Card*`                                                   | card.tsx       | –      | `CardTitle as` h2/h3/h4                                       | Do not nest cards                                                      |
| `Badge`, `AppointmentStatusBadge`, `IntegrationModeBadge` | badge.tsx      | –      | tone ×7, status ×8, mode ×3                                   | Icon + text, never colour alone. Mock mode explained to screen readers |
| `Table*`, `TableContainer`                                | table.tsx      | –      | —                                                             | `th scope="col"` default. Caption required. Container scrolls          |
| `Tabs*`                                                   | tabs.tsx       | ✓      | underline style                                               | Radix roving tabindex. List scrolls on mobile                          |
| `Dialog*`                                                 | dialog.tsx     | ✓      | size sm/md/lg                                                 | Focus trap, Escape, focus return. A title is required                  |
| `Drawer*`                                                 | dialog.tsx     | ✓      | side left/right, width default/wide                           | Same contract as Dialog                                                |
| `DropdownMenu*`                                           | menu.tsx       | ✓      | `destructive` item                                            | Arrow-key navigation                                                   |
| `Tooltip`, `TooltipProvider`                              | menu.tsx       | ✓      | `side`                                                        | Supplements a label and never replaces it                              |
| `Alert`                                                   | states.tsx     | –      | tone ×4, `assertive`                                          | `role="status"` (or `alert` when assertive)                            |
| `Skeleton`, `EmptyState`, `LoadingState`                  | states.tsx     | –      | `icon`, `action`                                              | Loading is announced politely                                          |
| `ErrorState`, `Toaster`, `toast`                          | feedback.tsx   | ✓      | `onRetry`                                                     | `role="alert"`. Retry button                                           |
| `SkipLink`, `Breadcrumbs`, `PageHeader`                   | navigation.tsx | –      | `linkComponent` (Next `Link`)                                 | `aria-current="page"`, one `h1`                                        |
| `AppShell`                                                | app-shell.tsx  | ✓      | `sections`, `activeHref`, `topBar`, `banner`, `linkComponent` | Skip link, `<main id="main-content">`, mobile drawer with focus return |
| `Container`, `Section`, `SectionHeader`, `Placeholder`    | public.tsx     | –      | section tone ×4, header align                                 | Heading level configurable (`h1`/`h2`)                                 |

## Planned domain components (built in their phases, in `apps/web`)

| Component                                                                                                | Phase |
| -------------------------------------------------------------------------------------------------------- | ----- |
| Public site header/footer, WhatsApp CTA, service cards, FAQ accordion, map/contact                       | 3     |
| User menu, login form                                                                                    | 4     |
| Patient header (allergy alert), patient timeline, appointment calendar (day/week/month), reception queue | 5     |
| Odontogram (FDI), treatment-plan table, clinical-note editor with version history                        | 6     |
| Invoice view, payment entry, receipt print layout, stock table                                           | 7     |
| Conversation list/thread, template picker                                                                | 8     |
| Workflow execution timeline                                                                              | 9     |
| Content calendar                                                                                         | 10    |
| KPI tile, funnel chart                                                                                   | 11    |
