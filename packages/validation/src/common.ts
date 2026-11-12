import { z } from 'zod';

export const uuidSchema = z.uuid();

/** Offset pagination for staff list screens (docs/api/api-conventions.md). */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

/** Sort parameter: `field` or `-field`, restricted to an allow-list. */
export function sortSchema<const T extends readonly [string, ...string[]]>(fields: T) {
  return z
    .string()
    .regex(/^-?[A-Za-z]+$/)
    .transform((v, ctx) => {
      const name = v.replace(/^-/, '');
      const field = fields.find((f): f is T[number] => f === name);
      if (field === undefined) {
        ctx.addIssue({ code: 'custom', message: 'unsupported sort field' });
        return z.NEVER;
      }
      return { field, direction: v.startsWith('-') ? ('desc' as const) : ('asc' as const) };
    });
}

/** Standard API error envelope. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), issue: z.string() })).optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Indian mobile/landline in E.164 (+91 followed by 10 digits). Accepts common
 * input forms (spaces, dashes, leading 0 or 91) and normalises to +91XXXXXXXXXX.
 */
export const indianPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ''))
  .transform((v) => {
    if (/^\+91\d{10}$/.test(v)) return v;
    if (/^91\d{10}$/.test(v)) return `+${v}`;
    if (/^0\d{10}$/.test(v)) return `+91${v.slice(1)}`;
    if (/^\d{10}$/.test(v)) return `+91${v}`;
    return v;
  })
  .pipe(z.string().regex(/^\+91[1-9]\d{9}$/, 'Enter a valid Indian phone number'));
