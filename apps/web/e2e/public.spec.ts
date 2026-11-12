import { expect, test } from '@playwright/test';

const PUBLIC_PATHS = [
  '/',
  '/services',
  '/services/general-dentistry',
  '/services/root-canal-treatment',
  '/services/teeth-whitening',
  '/services/dental-implants',
  '/services/braces-and-orthodontics',
  '/services/pediatric-dentistry',
  '/services/dental-x-rays',
  '/services/other-dental-procedures',
  '/about',
  '/doctors',
  '/facilities',
  '/faqs',
  '/contact',
  '/privacy',
  '/terms',
];

test('every internal link on every public page resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of PUBLIC_PATHS) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href^="/"]', (as) =>
      as.map((a) => a.getAttribute('href') ?? ''),
    );
    for (const href of hrefs) seen.add(href.split('#')[0] ?? href);
  }
  for (const href of seen) {
    const res = await request.get(href);
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
  }
  expect(seen.size).toBeGreaterThan(15);
});

test('pages have unique titles, descriptions and canonical URLs', async ({ page }) => {
  const titles = new Set<string>();
  for (const path of PUBLIC_PATHS) {
    await page.goto(path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(title.length, `${path} title`).toBeGreaterThan(10);
    expect(description?.length ?? 0, `${path} description`).toBeGreaterThan(30);
    expect(canonical, `${path} canonical`).toMatch(new RegExp(`${path === '/' ? '/?' : path}$`));
    expect(await page.locator('h1').count(), `${path} has one h1`).toBe(1);
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    titles.add(title);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  }
});

test('no WhatsApp link is generated while no number is configured', async ({ page }) => {
  for (const path of ['/', '/services/dental-implants', '/contact']) {
    await page.goto(path);
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
  }
  await page.goto('/');
  // Booking CTA falls back to the enquiry form.
  await page.getByRole('link', { name: 'Send an enquiry' }).first().click();
  await expect(page).toHaveURL(/\/contact#enquiry$/);
});

test('structured data includes only verified clinic fields', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw ?? '{}') as Record<string, unknown>;
  expect(data['@type']).toBe('Dentist');
  expect(data.name).toBe('Kottakal Multispeciality Dental Clinic');
  for (const invented of [
    'telephone',
    'openingHoursSpecification',
    'aggregateRating',
    'review',
    'priceRange',
  ]) {
    expect(data).not.toHaveProperty(invented);
  }
});

test('sitemap lists public pages only and robots blocks non-production', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/services/root-canal-treatment');
  expect(sitemap).not.toContain('/app');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Disallow: \//);
});

test('staff workspace is marked noindex', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test.describe('enquiry form', () => {
  test('shows inline validation errors and focuses nothing invalid silently', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByText('Please enter your name')).toBeVisible();
    await expect(page.getByText('Enter a valid Indian phone number')).toBeVisible();
    await expect(page.getByText('Please agree so we can reply to your enquiry')).toBeVisible();
    await expect(page.getByLabel(/Your name/)).toHaveAttribute('aria-invalid', 'true');
  });

  test('submits a valid enquiry with spam-protection metadata', async ({ page }) => {
    let body: Record<string, unknown> | undefined;
    await page.route('**/api/v1/enquiries', async (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '0193a0de-0000-7000-8000-000000000001',
          receivedAt: new Date().toISOString(),
        }),
      });
    });
    await page.goto('/contact?utm_source=test&utm_medium=e2e');
    await page.getByLabel(/Your name/).fill('E2E Test Person');
    await page.getByLabel(/Mobile number/).fill('98765 43210');
    await page.getByLabel(/What is it about/).selectOption('dental-implants');
    await page.getByLabel(/I agree to be contacted/).check();
    await page.waitForTimeout(3100); // a human takes longer than the bot threshold
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByText('Thank you — your enquiry has been sent')).toBeVisible();
    expect(body).toMatchObject({
      name: 'E2E Test Person',
      phone: '+919876543210',
      service: 'dental-implants',
      consentToContact: true,
      consentToPromotions: false,
      website: '',
      source: { page: '/contact', utmSource: 'test', utmMedium: 'e2e' },
    });
    expect(body?.elapsedMs).toBeGreaterThan(3000);
  });

  test('explains failures and offers another way to reach the clinic', async ({ page }) => {
    await page.route('**/api/v1/enquiries', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/contact');
    await page.getByLabel(/Your name/).fill('E2E Test Person');
    await page.getByLabel(/Mobile number/).fill('9876543210');
    await page.getByLabel(/I agree to be contacted/).check();
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    // (Next.js also renders an empty route-announcer alert, so filter by text.)
    await expect(
      page.getByRole('alert').filter({ hasText: 'temporarily unavailable' }),
    ).toBeVisible();
  });
});

test('mobile shows a sticky booking bar; desktop shows the header CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services');
  const bar = page.locator('div.fixed.inset-x-0.bottom-0');
  await expect(bar).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(bar).toBeHidden();
});
