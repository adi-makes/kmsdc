import type { RoleKey } from './domain.js';

/**
 * Permission catalogue — mirrors docs/security/access-control-matrix.md.
 * Change both together; the API seeds roles from ROLE_PERMISSIONS and the authorisation test
 * suite asserts the matrix role-by-role.
 *
 * Matrix legend mapping:
 *  ✅ / 🔸 (limited) → permission granted; the 🔸 limits are enforced by record-level scoping
 *                      in the owning service (documented next to each permission).
 *  🅾 (own only)     → patient-portal permissions are added with the portal (later phase).
 */
export const PERMISSIONS = {
  // Administration
  'users.read': 'View staff accounts',
  'users.manage': 'Create, update and deactivate staff accounts (audited)',
  'roles.manage': 'Create roles and change role permissions (audited)',
  'sessions.revoke': "Revoke other users' sessions (audited)",
  'settings.read': 'View clinic settings (profile, hours, chairs)',
  'settings.manage': 'Change clinic settings (audited)',
  'integrations.manage': 'Enable or disable external integrations (audited)',
  'audit.read': 'View the audit log',
  // Patients
  'patients.read': 'View patient demographics and contact details',
  'patients.create': 'Register patients',
  'patients.update': 'Update patient demographics and contact details (audited)',
  'patients.merge': 'Merge duplicate patient records (audited)',
  'patients.export': 'Export patient data (audited)',
  'patients.delete': 'Anonymise a patient record (audited)',
  'consent.read': 'View consent records',
  'consent.manage': 'Record consent grants and withdrawals (audited)',
  // Enquiries
  'enquiries.read': 'View website and WhatsApp enquiries',
  'enquiries.manage': 'Update enquiry status and assignment',
  // Scheduling
  'appointments.read': 'View appointments',
  'appointments.manage': 'Create, reschedule, cancel and progress appointments',
  'schedules.manage': 'Manage dentist schedules and availability',
  // Clinical
  'clinical.read': 'View clinical records (access logged)',
  'clinical.write': 'Create and edit draft clinical records',
  'clinical.finalise': 'Finalise clinical notes (audited)',
  'clinical.amend': 'Amend finalised clinical notes (audited)',
  'prescriptions.write': 'Write prescriptions (audited)',
  'treatment_plans.read': 'View treatment plans',
  'treatment_plans.write': 'Create and edit treatment plans',
  'treatment_plans.record_approval': 'Record patient approval of a treatment plan (audited)',
  'documents.read': 'View patient documents and images (access logged)',
  'documents.upload': 'Upload patient documents and images',
  // Billing
  'billing.read': 'View invoices and payments',
  'billing.invoice': 'Create and issue invoices',
  'billing.discount': 'Apply discounts (audited)',
  'billing.payment': 'Record payments (audited)',
  'billing.refund': 'Record refunds (audited)',
  'billing.void': 'Void invoices and payments via reversing entries (audited)',
  'billing.reconcile': 'Perform daily reconciliation (audited)',
  // Inventory
  'inventory.read': 'View stock',
  'inventory.consume': 'Record stock consumption',
  'inventory.manage': 'Manage products, suppliers, purchase orders and adjustments (audited)',
  // Communication
  'inbox.read': 'View conversations',
  'inbox.reply': 'Reply to conversations',
  'templates.manage': 'Manage message templates (audited)',
  // Automation
  'workflows.read': 'View workflows and executions',
  'workflows.manage': 'Configure, pause and resume workflows (audited)',
  'workflows.approve': 'Approve sensitive workflow sends (audited)',
  // Marketing
  'marketing.read': 'View the marketing workspace',
  'marketing.manage': 'Create drafts, calendar entries and media',
  'marketing.approve_clinical': 'Approve clinical claims in marketing content (audited)',
  'marketing.publish': 'Publish or mark content as published (audited)',
  'campaigns.send': 'Send or request campaigns (audited)',
  // Analytics
  'analytics.clinic': 'View clinic analytics',
  'analytics.marketing': 'View marketing analytics (aggregated)',
  'analytics.export': 'Export analytics (audited)',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

const ALL = PERMISSION_KEYS;

/** Clinical accountability stays with registered dentists — not even Super Admin has these. */
export const DENTIST_ONLY: readonly PermissionKey[] = [
  'clinical.finalise',
  'clinical.amend',
  'prescriptions.write',
  'treatment_plans.write',
  'marketing.approve_clinical',
];

export const ROLE_PERMISSIONS: Readonly<Record<RoleKey, readonly PermissionKey[]>> = {
  SUPER_ADMIN: ALL.filter((p) => !DENTIST_ONLY.includes(p) && p !== 'clinical.write'),
  CLINIC_ADMIN: ALL.filter(
    (p) => !DENTIST_ONLY.includes(p) && !['clinical.write', 'patients.delete'].includes(p),
  ),
  DENTIST: [
    'settings.read',
    'patients.read',
    'patients.create',
    'patients.update',
    'consent.read',
    'consent.manage',
    'appointments.read',
    'appointments.manage',
    'schedules.manage', // own availability only (service-level scope)
    'clinical.read',
    'clinical.write',
    'clinical.finalise',
    'clinical.amend',
    'prescriptions.write',
    'treatment_plans.read',
    'treatment_plans.write',
    'treatment_plans.record_approval',
    'documents.read',
    'documents.upload',
    'billing.read', // own patients' invoice status (service-level scope)
    'inventory.read',
    'inventory.consume',
    'inbox.read', // assigned conversations only
    'inbox.reply',
    'marketing.read',
    'marketing.approve_clinical',
    'analytics.clinic', // own statistics
  ],
  RECEPTIONIST: [
    'settings.read',
    'patients.read',
    'patients.create',
    'patients.update',
    'patients.merge', // propose only; admin approval (service-level)
    'consent.read',
    'consent.manage',
    'enquiries.read',
    'enquiries.manage',
    'appointments.read',
    'appointments.manage',
    'treatment_plans.read', // items and costs, no clinical notes
    'treatment_plans.record_approval',
    'documents.read', // non-clinical documents only
    'documents.upload',
    'billing.read',
    'billing.invoice',
    'billing.discount', // up to a configured limit
    'billing.payment',
    'inventory.read',
    'inbox.read',
    'inbox.reply',
    'workflows.read',
  ],
  DENTAL_ASSISTANT: [
    'settings.read',
    'patients.read',
    'consent.read',
    'appointments.read',
    'appointments.manage', // check-in / start only
    'clinical.read',
    'clinical.write', // drafts and chart proposals only
    'treatment_plans.read',
    'documents.read',
    'documents.upload',
    'inventory.read',
    'inventory.consume',
  ],
  ACCOUNTANT: [
    'settings.read',
    'patients.read', // identity and contact only
    'appointments.read', // date / patient / status only
    'treatment_plans.read', // items and costs only
    'billing.read',
    'billing.invoice',
    'billing.discount',
    'billing.payment',
    'billing.refund',
    'billing.void',
    'billing.reconcile',
    'inventory.read',
    'inventory.manage', // purchase orders and suppliers
    'analytics.clinic', // financial KPIs
    'analytics.export',
  ],
  MARKETING_MANAGER: [
    'settings.read',
    'enquiries.read', // aggregate attribution only — no PII (service-level)
    'templates.manage', // promotional templates only
    'workflows.read', // campaign workflows
    'marketing.read',
    'marketing.manage',
    'marketing.publish',
    'campaigns.send', // request; admin approves
    'analytics.marketing',
    'analytics.export',
  ],
  PATIENT: [],
};

export const ROLE_NAMES: Readonly<Record<RoleKey, string>> = {
  SUPER_ADMIN: 'Super Admin',
  CLINIC_ADMIN: 'Clinic Admin',
  DENTIST: 'Dentist',
  RECEPTIONIST: 'Receptionist',
  DENTAL_ASSISTANT: 'Dental Assistant',
  ACCOUNTANT: 'Accountant',
  MARKETING_MANAGER: 'Marketing Manager',
  PATIENT: 'Patient',
};

export function roleHasPermission(role: RoleKey, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
