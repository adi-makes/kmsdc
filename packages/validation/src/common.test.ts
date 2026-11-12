import { describe, expect, it } from 'vitest';
import { indianPhoneSchema, paginationQuerySchema, sortSchema } from './common.js';

describe('paginationQuerySchema', () => {
  it('defaults and coerces', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 25 });
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });
  it('caps page size', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});

describe('sortSchema', () => {
  const s = sortSchema(['createdAt', 'fullName']);
  it('parses direction', () => {
    expect(s.parse('-createdAt')).toEqual({ field: 'createdAt', direction: 'desc' });
    expect(s.parse('fullName')).toEqual({ field: 'fullName', direction: 'asc' });
  });
  it('rejects unknown fields', () => {
    expect(s.safeParse('passwordHash').success).toBe(false);
  });
});

describe('indianPhoneSchema', () => {
  it.each([
    ['98765 43210', '+919876543210'],
    ['+91 98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
  ])('normalises %s', (input, expected) => {
    expect(indianPhoneSchema.parse(input)).toBe(expected);
  });
  it('rejects junk', () => {
    expect(indianPhoneSchema.safeParse('12345').success).toBe(false);
    expect(indianPhoneSchema.safeParse('+1 555 123 4567').success).toBe(false);
  });
});
