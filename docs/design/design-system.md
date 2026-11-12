# Design system

**Status:** Phase 2 complete (2026-11-12). Live reference at **`/app/design-system`** (staff
workspace). Source: `packages/ui` (tokens in `src/styles.css`, components in `src/components/`).

> **Brand is PROVISIONAL.** The clinic's logo, colours and fonts have not been supplied yet. The deep
> teal palette and the "K" monogram are placeholders. To rebrand, edit the `BRAND` primitive block
> in `packages/ui/src/styles.css`, run `pnpm check:contrast`, and replace the monogram in
> `apps/web/src/components/staff/staff-shell.tsx` and the public header (Phase 3). No component code
> changes.

## 1. Direction

Researched with the `ui-ux-pro-max` skill (query: dental clinic, healthcare, trustworthy, premium;
variance 3, motion 2, density 4). It recommended Swiss minimalism with a calm teal/health-green
palette, accessibility-first type and subtle motion, and to avoid neon colours, heavy motion and
purple/pink "AI" gradients. We adopted the direction and adjusted the palette for contrast. The
suggested cyan with black text was replaced by a deep teal with white text.

| Experience          | Feel                                         | How it is achieved                                                                                                                                                                                  |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public website**  | Trustworthy, premium, calm, patient-friendly | White and very light tinted sections, large Figtree headings, generous spacing (`py-16 → py-24`), few borders, one strong WhatsApp CTA, real photography only (none until supplied), minimal motion |
| **Staff workspace** | Healthcare SaaS: organised, efficient, calm  | Neutral canvas (`bg-app`), white surfaces with 1px borders rather than shadows, a 14px dense-but-readable scale, tabular numbers, a status vocabulary (colour + icon + text), keyboard-first        |

## 2. Tokens (three layers)

1. **Primitives:** `brand-*` (provisional teal), `neutral-*`, `whatsapp-*`, `success/warning/danger/info/violet-*`.
2. **Semantic** (used by components): `bg`, `bg-app`, `bg-subtle`, `bg-muted`, `bg-inverse`,
   `surface`, `fg`, `fg-muted`, `fg-subtle`, `fg-brand`, `fg-link`, `border`, `border-strong`, `primary`,
   `primary-hover`, `primary-fg`, `primary-subtle`, `whatsapp`, `success|warning|danger|info|accent`
   (+ `-bg`, `-border`), `ring`, `overlay`.
3. **Component:** control heights (`--control-height` 40px, touch 44px), radii and the focus ring.

Tailwind's default palette is reset (`--color-*: initial`), so only Kottakal tokens exist. Raw hex
values in components are not possible.

### Colour and contrast

All 23 text/UI pairs used by components are verified by `pnpm check:contrast` (CI gate):
text ≥ 4.5:1 (WCAG 1.4.3) and focus ring ≥ 3:1 (WCAG 1.4.11). Status is never conveyed by colour alone.

### Typography

| Role      | Font                    | Notes                                                            |
| --------- | ----------------------- | ---------------------------------------------------------------- |
| Headings  | **Figtree** (600)       | Friendly, modern, clinical-clean                                 |
| Body / UI | **Noto Sans** (400/500) | Highly legible. The Noto family covers Malayalam for future i18n |
| Numbers   | `.tabular` utility      | Tabular figures in tables, times and money                       |

Fonts are **self-hosted** by `next/font` at build time, so visitors' browsers never contact Google.
Scale: 12 (metadata only) · 14 · 16 (body) · 18 · 20 · 24 · 30 · 36 · 48 · 60. Body line height is 1.5.
Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty`.

### Spacing, shape, elevation

- Tailwind's 4px spacing scale. Staff pages use 16 to 32px rhythm; public sections use 64 to 96px vertical padding.
- Radii: controls 8px, cards 12px, public feature panels 16 to 24px, pills full.
- Elevation: **borders first**. Shadows only for floating layers (menus `md`, dialogs `lg`) and a hairline `xs` on controls and cards.

### Breakpoints (mobile-first)

`sm` 640 · `md` 768 (tablet portrait) · `lg` 1024 (sidebar appears) · `xl` 1280 · `2xl` 1536.
QA viewports: **390** (mobile), **834** (tablet), **1440** (desktop).

### Motion

150 to 220ms with the standard easing. Fade or pop for overlays, slide for drawers. `prefers-reduced-motion`
disables animation globally. No scroll-jacking and no decorative motion.

## 3. Component library (`@kmsdc/ui`)

See [component-inventory.md](./component-inventory.md) for the full list with states and accessibility
notes. Built in the shadcn/ui pattern (Radix UI primitives + `class-variance-authority` + Tailwind),
customised to these tokens and owned in-repo rather than generated by the shadcn CLI (ADR-022).

### Button hierarchy

| Variant     | Use                                                                         |
| ----------- | --------------------------------------------------------------------------- |
| `primary`   | The single main action of a view                                            |
| `secondary` | Alternatives (Cancel, Export)                                               |
| `subtle`    | Brand-tinted secondary (filters, quick actions)                             |
| `ghost`     | Toolbar / low emphasis                                                      |
| `danger`    | Destructive. Always behind a confirmation dialog that names the consequence |
| `whatsapp`  | Public booking CTA only                                                     |
| `link`      | Inline navigation                                                           |

`IconButton` requires a `label` (its accessible name). Buttons default to `type="button"`. `loading`
disables the button and sets `aria-busy`.

### Patterns

- **Forms:** `FormField` render-prop wires `id`, `aria-describedby` (help + error), `aria-invalid` and
  `aria-required`. Visible label always. Help text above the control, error below with an icon. Inputs
  are 16px on mobile (no iOS zoom). `NativeSelect` is preferred for simple choices.
- **Tables:** `TableContainer` scrolls horizontally inside itself (and is `relative` so `sr-only` text
  cannot escape and widen the page). Uppercase 12px headers, 14px rows, row actions in a `DropdownMenu`
  behind a labelled `IconButton`, and a caption on every table.
- **Dialogs vs drawers:** a dialog is for a decision or a short form. A drawer is for viewing or editing
  details while keeping context. Both trap focus, close on Escape and return focus to the trigger.
- **Feedback:** inline `Alert` for persistent messages. `toast` only for transient confirmations
  (never the only copy of an error). `EmptyState`, `LoadingState`, `ErrorState` (with retry) and
  `Skeleton` mean every async view has a defined state.
- **Navigation:** `AppShell` has a skip link, a fixed 256px sidebar from `lg`, and a drawer below.
  `aria-current="page"` marks the active item, and badge counts are announced. `PageHeader` holds
  breadcrumbs, one `h1`, a description and actions.
- **Integrations:** `IntegrationModeBadge` (Mock mode / Live / Not connected) is mandatory wherever an
  external provider is involved (ADR-010).
- **Missing clinic data:** `Placeholder` renders "To be confirmed: …". Information is never invented.
- **Environment:** non-production builds show a "synthetic data only" banner, driven by `NEXT_PUBLIC_APP_ENV`.

## 4. Icons

Lucide only (`lucide-react`). Icons are 16px in dense UI and 20px in navigation and buttons. They are
decorative by default (`aria-hidden`), and the accompanying text carries the meaning. No emoji as icons.
Clinical findings (odontogram) will use clinical notation, not decorative icons (Phase 6).

## 5. Accessibility rules (enforced)

WCAG 2.2 AA target. Automated with **axe-core** in Playwright on every page at desktop and mobile
(`pnpm test:e2e`). Keyboard tests cover the skip link, drawer focus trap and return, and dialog Escape.
The overflow test fails if any page scrolls horizontally at 390, 834 or 1440px.
See [ux-guidelines.md](./ux-guidelines.md).

## 6. Visual QA log

| Date       | Pages                          | Viewports        | Findings → fixes                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | home, dashboard, design system | 390 / 834 / 1440 | (1) `sr-only` text in tables widened the page by 151px on mobile → container made `relative`. (2) Drawer did not return focus → real `DrawerTrigger`. (3) Subtle button nearly invisible on canvas → brand-100. (4) `fg-subtle` 4.26:1 on canvas → darkened to 4.91:1. (5) Env banner hidden in optimised builds → `NEXT_PUBLIC_APP_ENV`. |

Screenshots are written to `screenshots/` (git-ignored) locally and uploaded as a CI artifact.
