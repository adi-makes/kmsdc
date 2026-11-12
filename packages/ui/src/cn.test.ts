import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

const when = (condition: boolean, value: string) => condition && value;

describe('cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
  it('drops falsy values', () => {
    expect(cn('a', when(false, 'b'), undefined, 'c')).toBe('a c');
  });
});
