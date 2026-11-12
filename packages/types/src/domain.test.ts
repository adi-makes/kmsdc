import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSITIONS,
  SLOT_BLOCKING_STATUSES,
  canTransitionAppointment,
} from './domain.js';

describe('appointment lifecycle', () => {
  it('follows the documented happy path', () => {
    expect(canTransitionAppointment('REQUESTED', 'CONFIRMED')).toBe(true);
    expect(canTransitionAppointment('CONFIRMED', 'CHECKED_IN')).toBe(true);
    expect(canTransitionAppointment('CHECKED_IN', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionAppointment('IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('treats terminal states as final', () => {
    for (const terminal of ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'] as const) {
      expect(APPOINTMENT_TRANSITIONS[terminal]).toHaveLength(0);
    }
  });

  it('does not allow skipping check-in', () => {
    expect(canTransitionAppointment('CONFIRMED', 'COMPLETED')).toBe(false);
    expect(canTransitionAppointment('REQUESTED', 'IN_PROGRESS')).toBe(false);
  });

  it('only references known statuses', () => {
    for (const targets of Object.values(APPOINTMENT_TRANSITIONS)) {
      for (const t of targets) expect(APPOINTMENT_STATUSES).toContain(t);
    }
    expect(SLOT_BLOCKING_STATUSES).not.toContain('COMPLETED');
  });
});
