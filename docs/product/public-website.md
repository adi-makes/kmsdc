# Public website

**Status:** Phase 3 complete (2026-11-12). Built with Next.js App Router in `apps/web/src/app/(public)`.
Every page is pre-rendered as static HTML.

## Pages

| Route                                             | Purpose                                                   | Data shown only when supplied                           |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `/`                                               | Hero, booking steps, 8 services, FAQs, location & contact | Doctors section, map link, hours, phone, email          |
| `/services`                                       | All services                                              | —                                                       |
| `/services/[slug]`                                | 8 service pages (general information + FAQs + booking)    | —                                                       |
| `/about`                                          | Verified facts about the clinic                           | —                                                       |
| `/doctors`                                        | Dentist profiles                                          | Everything: "coming soon" until verified profiles exist |
| `/facilities`                                     | Facilities                                                | Everything: "coming soon" until supplied                |
| `/faqs`                                           | General and treatment FAQs                                | —                                                       |
| `/contact`                                        | Clinic details + enquiry form                             | Street, PIN, map, hours, phone, email                   |
| `/privacy`, `/terms`                              | Draft legal pages (shown as **pending legal review**)     | Grievance officer, review dates                         |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | SEO                                                       | —                                                       |

## Where the clinic's information lives

`apps/web/src/content/clinic-profile.ts` is the single source of truth for public clinic data, typed
and validated by `clinicProfileSchema` (`packages/validation/src/clinic.ts`). An invalid value fails
the build. Everything not yet supplied is `null` or empty, and the site adapts:

| Missing              | Behaviour                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| WhatsApp number      | Booking buttons become **"Send an enquiry"** → `/contact#enquiry`. No `wa.me` link is ever generated |
| Hours                | "Please contact the clinic for current timings." No `openingHoursSpecification` in JSON-LD           |
| Street / PIN / map   | City only, plus "The full address and map will be added soon."                                       |
| Doctors / facilities | Polite "coming soon" empty states. Homepage doctor section hidden                                    |
| Testimonials         | Section not rendered (requires a written consent reference per testimonial)                          |
| Social links         | Hidden                                                                                               |

Staff can see what is missing at **`/app/setup`** (computed from the live profile). From Phase 4 the
profile can also be managed in the database (ClinicSettings). This file remains the build-time fallback.

## Review gates (publishing safety)

| Gate             | Rule                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clinical content | Each service in `content/services.ts` has `review.status`. **Production builds fail** while any page is `pending-dentist-review`. To approve, a dentist reviews the text, then set `status: 'approved', reviewedBy, reviewedOn`. |
| Legal pages      | Production builds fail until `legal.privacyPolicyReviewedOn` / `termsReviewedOn` are set after professional review.                                                                                                              |
| Banned language  | A unit test rejects prices, "guarantee", "painless", "best", "100%" and similar in service content.                                                                                                                              |
| Indexing         | `robots.txt` disallows everything unless `NEXT_PUBLIC_APP_ENV=production`. `/app` is always `noindex`.                                                                                                                           |

## SEO

- Unique `<title>` and meta description per page (template `%s | Kottakal Multispeciality Dental Clinic`), checked by e2e.
- Canonical URLs (`alternates.canonical`) resolved against `NEXT_PUBLIC_SITE_URL`.
- Open Graph and Twitter metadata, plus a generated default OG image (text only until branding exists).
- `schema.org/Dentist` JSON-LD built **only** from verified fields (no telephone, hours, ratings or reviews unless supplied). It is safely serialised (`<` escaped).
- `sitemap.xml` covers public pages and all service pages. The staff workspace is never listed.
- Semantic HTML: one `h1` per page, landmarks, breadcrumbs, `<details>` FAQ accordion (works without JS).
- Performance: all pages are static, fonts are self-hosted, and no third-party scripts, trackers or embedded maps are loaded.

## Enquiry form (integration boundary)

- Component: `components/public/enquiry-form.tsx` (React Hook Form + shared `enquiryFormSchema`).
- **Consent:** contact consent is required (operational). Promotional consent is a separate, optional, never pre-ticked box.
- **Spam protection:** hidden honeypot field, fill-time measurement (`elapsedMs`; under 3 seconds is treated as a bot server-side), and server-side rate limiting.
- **Attribution:** page, referrer and UTM parameters are sent with the enquiry (first-party, for the analytics funnel).
- **Endpoint:** `POST /api/v1/enquiries` via `@kmsdc/api-client`. The API endpoint is implemented in Phase 4. Until then the form shows an honest "temporarily unavailable" message with alternative contact routes. Nothing is ever faked as "sent".
- No medical details are requested, and the form tells visitors not to include them.

## Analytics hooks

WhatsApp CTAs carry `data-analytics="whatsapp_click"`. First-party, aggregate-only click counting is
implemented in Phase 11. No third-party analytics is installed.

## Tests

`apps/web/e2e/public.spec.ts`:

- internal-link crawl
- unique titles, descriptions, canonicals and a single `h1`
- no `wa.me` link without a configured number
- JSON-LD contains only verified fields
- sitemap and robots
- `noindex` on the staff workspace
- enquiry validation, success (with spam metadata and UTM) and failure with alternatives
- mobile booking bar

`a11y.spec.ts` runs axe WCAG 2.2 AA checks, and `visual.spec.ts` captures screenshots and checks for
overflow at 390, 834 and 1440px, both on every public page.
