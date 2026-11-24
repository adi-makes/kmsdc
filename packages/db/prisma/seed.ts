/**
 * Synthetic seed data for development and preview ONLY.
 *
 * - Creates the clinic, a default branch, the permission catalogue and the 8 system roles.
 * - Creates one demo staff account per role with obviously fake details ("[DEMO]" names,
 *   @example.invalid emails — a reserved TLD that can never receive mail).
 * - Never contains real people, patients or clinic contact details.
 * - Idempotent: safe to run repeatedly (upserts).
 *
 * Demo password: DEMO_USER_PASSWORD env var, or a random one printed once.
 */
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { PERMISSIONS, ROLE_KEYS, ROLE_NAMES, ROLE_PERMISSIONS } from '@kmsdc/types';
import { createPrismaClient } from '../src/index.js';

const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const; // OWASP minimum for Argon2id

const CLINIC_PROFILE = {
  name: 'Kottakal Multispeciality Dental Clinic',
  shortName: 'Kottakal Dental',
  address: {
    streetAddress: null,
    locality: 'Pathanamthitta',
    region: 'Kerala',
    postalCode: null,
    country: 'IN',
  },
  mapUrl: null,
  geo: null,
  whatsappNumber: null,
  phoneNumbers: [],
  email: null,
  openingHours: null,
  doctors: [],
  facilities: [],
  testimonials: [],
  social: {
    instagram: null,
    facebook: null,
    youtube: null,
    linkedin: null,
    googleBusinessProfile: null,
  },
  legal: {
    grievanceOfficerName: null,
    grievanceOfficerEmail: null,
    privacyPolicyReviewedOn: null,
    termsReviewedOn: null,
  },
};

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Refusing to seed demo accounts in production (set ALLOW_DEMO_SEED=true for previews only).',
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const prisma = createPrismaClient({ connectionString: url, max: 2 });

  const clinic = await prisma.clinic.upsert({
    where: { slug: 'kottakal' },
    update: {},
    create: { name: CLINIC_PROFILE.name, slug: 'kottakal', timezone: 'Asia/Kolkata' },
  });
  await prisma.branch.upsert({
    where: { clinicId_name: { clinicId: clinic.id, name: 'Main' } },
    update: {},
    create: { clinicId: clinic.id, name: 'Main', isDefault: true },
  });
  await prisma.clinicSettings.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: { clinicId: clinic.id, profile: CLINIC_PROFILE },
  });

  // Permission catalogue
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description, module: key.split('.')[0] ?? key },
      create: { key, description, module: key.split('.')[0] ?? key },
    });
  }
  const permissionIds = new Map(
    (await prisma.permission.findMany({ select: { id: true, key: true } })).map((p) => [
      p.key,
      p.id,
    ]),
  );

  // System roles — permissions are re-synchronised from the catalogue on every seed.
  for (const roleKey of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: ROLE_NAMES[roleKey], isSystem: true },
      create: { key: roleKey, name: ROLE_NAMES[roleKey], isSystem: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: ROLE_PERMISSIONS[roleKey].map((key) => {
        const permissionId = permissionIds.get(key);
        if (!permissionId) throw new Error(`Unknown permission ${key}`);
        return { roleId: role.id, permissionId };
      }),
    });
  }

  // Demo staff accounts (synthetic)
  const generated = !process.env.DEMO_USER_PASSWORD;
  const password = process.env.DEMO_USER_PASSWORD ?? randomBytes(12).toString('base64url');
  const passwordHash = await hash(password, ARGON2_OPTIONS);
  const demoRoles = ROLE_KEYS.filter((r) => r !== 'PATIENT');
  for (const roleKey of demoRoles) {
    const email = `${roleKey.toLowerCase().replaceAll('_', '.')}@example.invalid`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName: `[DEMO] ${ROLE_NAMES[roleKey]}`, passwordHash },
    });
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
    await prisma.userRole.upsert({
      where: { userId_roleId_clinicId: { userId: user.id, roleId: role.id, clinicId: clinic.id } },
      update: {},
      create: { userId: user.id, roleId: role.id, clinicId: clinic.id },
    });
  }

  console.log(
    `Seeded clinic "${clinic.name}", ${String(permissionIds.size)} permissions, ${String(ROLE_KEYS.length)} roles.`,
  );
  console.log(
    'Demo accounts (synthetic): <role>@example.invalid, e.g. receptionist@example.invalid',
  );
  if (generated) {
    console.log(
      `Demo password (generated, shown once; existing accounts keep their old password): ${password}`,
    );
  }
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
