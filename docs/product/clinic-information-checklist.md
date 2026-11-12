# Clinic information checklist

The platform never invents clinic details. Each item below stays a **labelled placeholder** in the
Clinic Profile until the clinic provides it. The public site hides or disables any feature whose
data is missing.

**Where to enter it:** `apps/web/src/content/clinic-profile.ts` (validated at build). The live status is
shown to staff at `/app/setup`. Service pages also need **dentist approval** and the privacy and terms
pages need **legal review** before a production build is allowed (see [public-website.md](./public-website.md)).

| #   | Item                                                         | Status                                           | Used by                               | Behaviour while missing                           |
| --- | ------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------- | ------------------------------------------------- |
| 1   | Clinic legal / display name                                  | ✅ Known: Kottakal Multispeciality Dental Clinic | Everywhere                            | —                                                 |
| 2   | City / state / country                                       | ✅ Known: Pathanamthitta, Kerala, India          | Site, JSON-LD                         | —                                                 |
| 3   | Street address and PIN code                                  | ❌ Needed                                        | Contact page, JSON-LD, map            | Shows city only; no `streetAddress` in JSON-LD    |
| 4   | Map location (Google Maps link or lat/long)                  | ❌ Needed                                        | Location section                      | Map hidden; "Directions coming soon"              |
| 5   | WhatsApp booking number (E.164, e.g. +91…)                   | ❌ Needed                                        | Booking CTA                           | CTA disabled with notice                          |
| 6   | Phone number(s)                                              | ❌ Needed                                        | Header, contact, JSON-LD              | Hidden                                            |
| 7   | Email address                                                | ❌ Needed                                        | Contact                               | Hidden                                            |
| 8   | Opening hours (per weekday, holidays)                        | ❌ Needed                                        | Contact, JSON-LD, scheduling defaults | "Please contact us for timings"                   |
| 9   | Doctor names, qualifications, registration no., photos, bios | ❌ Needed                                        | Doctors page                          | Section hidden; page shows "Profiles coming soon" |
| 10  | Facilities list and photos                                   | ❌ Needed                                        | Facilities page                       | Generic description of available services only    |
| 11  | Logo (SVG preferred), brand colours, fonts                   | ❌ Needed                                        | Design system                         | Provisional palette marked `PROVISIONAL`          |
| 12  | Clinic photography                                           | ❌ Needed                                        | Hero, facilities                      | Neutral illustration / no imagery                 |
| 13  | Social media profile URLs                                    | ❌ Needed                                        | Footer, marketing                     | Hidden                                            |
| 14  | Testimonials (with written patient consent)                  | ❌ Needed                                        | Testimonials                          | Section hidden                                    |
| 15  | Google Business Profile link                                 | ❌ Needed                                        | Reviews, footer                       | Hidden                                            |
| 16  | Procedure price list (internal)                              | ❌ Needed                                        | Billing                               | Staff enter price per invoice line                |
| 17  | GST registration / tax applicability                         | ❌ Needed (accountant)                           | Billing                               | Tax disabled                                      |
| 18  | Privacy-policy contact / Grievance Officer details           | ❌ Needed (legal)                                | Privacy policy                        | Template marked "Pending legal review"            |
| 19  | Domain name                                                  | ❌ Needed                                        | SEO, canonical URLs                   | `NEXT_PUBLIC_SITE_URL` env placeholder            |
| 20  | Number of chairs / rooms                                     | ❌ Needed                                        | Scheduling                            | Admin creates chairs in settings                  |
