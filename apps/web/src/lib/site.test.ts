import { describe, expect, it } from 'vitest';
import { SERVICES, assertPublishable } from '@/content/services';
import { dentistJsonLd, formatIndianPhone, formatOpeningHours, jsonLdScript } from './site';

describe('dentistJsonLd', () => {
  it('contains only verified fields (no invented phone, hours or street)', () => {
    const data = dentistJsonLd();
    expect(data['@type']).toBe('Dentist');
    expect(data.name).toBe('Kottakal Multispeciality Dental Clinic');
    expect(data).not.toHaveProperty('telephone');
    expect(data).not.toHaveProperty('openingHoursSpecification');
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect((data.address as Record<string, string>).streetAddress).toBeUndefined();
  });
});

describe('jsonLdScript', () => {
  it('escapes "<" so content cannot close the script tag', () => {
    expect(jsonLdScript({ x: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});

describe('formatting', () => {
  it('formats Indian numbers', () => {
    expect(formatIndianPhone('+919876543210')).toBe('+91 98765 43210');
  });
  it('formats opening hours with closed days and split sessions', () => {
    const rows = formatOpeningHours([
      {
        day: 'monday',
        sessions: [
          { opens: '09:00', closes: '13:00' },
          { opens: '16:30', closes: '20:00' },
        ],
      },
      { day: 'tuesday', sessions: [] },
      { day: 'wednesday', sessions: [] },
      { day: 'thursday', sessions: [] },
      { day: 'friday', sessions: [] },
      { day: 'saturday', sessions: [] },
      { day: 'sunday', sessions: [] },
    ]);
    expect(rows[0]).toEqual({ day: 'Monday', text: '9 am – 1 pm, 4:30 pm – 8 pm' });
    expect(rows[1]?.text).toBe('Closed');
  });
});

describe('service content publishing guard', () => {
  it('covers all eight services from the specification', () => {
    expect(SERVICES).toHaveLength(8);
  });
  it('blocks unreviewed clinical content in production builds only', () => {
    const service = SERVICES[0];
    if (!service) throw new Error('missing');
    expect(() => {
      assertPublishable(service, 'production');
    }).toThrow(/not been approved/);
    expect(() => {
      assertPublishable(service, 'preview');
    }).not.toThrow();
  });
  it('contains no price or outcome-guarantee language', () => {
    const text = JSON.stringify(SERVICES).toLowerCase();
    const banned = [
      /₹/,
      /\brs\.?\s?\d/,
      /\binr\s?\d/,
      /guarantee/,
      /painless/,
      /100%/,
      /\bbest\b/,
      /cheapest/,
      /\bpermanent(ly)? (results|white)/,
    ];
    for (const pattern of banned) {
      expect(text).not.toMatch(pattern);
    }
  });
});
