import { describe, expect, it } from 'vitest';
import { ROLE_KEYS } from './domain.js';
import {
  DENTIST_ONLY,
  PERMISSION_KEYS,
  ROLE_PERMISSIONS,
  roleHasPermission,
} from './permissions.js';

describe('permission matrix invariants (docs/security/access-control-matrix.md)', () => {
  it('defines permissions for every role and only known keys', () => {
    for (const role of ROLE_KEYS) {
      for (const p of ROLE_PERMISSIONS[role]) expect(PERMISSION_KEYS).toContain(p);
    }
  });

  it('receptionists cannot touch clinical notes', () => {
    expect(roleHasPermission('RECEPTIONIST', 'clinical.read')).toBe(false);
    expect(roleHasPermission('RECEPTIONIST', 'clinical.write')).toBe(false);
  });

  it('accountants have no clinical access', () => {
    expect(roleHasPermission('ACCOUNTANT', 'clinical.read')).toBe(false);
    expect(roleHasPermission('ACCOUNTANT', 'billing.refund')).toBe(true);
  });

  it('marketing has no patient or clinical access', () => {
    for (const p of ['patients.read', 'clinical.read', 'documents.read', 'inbox.read'] as const) {
      expect(roleHasPermission('MARKETING_MANAGER', p)).toBe(false);
    }
  });

  it('clinical finalisation, amendment and prescribing are dentist-only — even over Super Admin', () => {
    for (const role of ROLE_KEYS) {
      for (const p of DENTIST_ONLY) {
        expect(roleHasPermission(role, p), `${role} ${p}`).toBe(role === 'DENTIST');
      }
    }
  });

  it('only administrators manage users and roles', () => {
    const managers = ROLE_KEYS.filter((r) => roleHasPermission(r, 'users.manage'));
    expect(managers.sort()).toEqual(['CLINIC_ADMIN', 'SUPER_ADMIN']);
  });

  it('patients receive no staff permissions', () => {
    expect(ROLE_PERMISSIONS.PATIENT).toHaveLength(0);
  });
});
