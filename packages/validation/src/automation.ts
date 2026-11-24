import { z } from 'zod';

export const WORKFLOW_TRIGGER_TYPES = [
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_REMINDER_DUE',
  'APPOINTMENT_COMPLETED',
  'APPOINTMENT_NO_SHOW',
  'PATIENT_REGISTERED',
  'PATIENT_BIRTHDAY',
  'ROUTINE_RECALL_DUE',
  'MANUAL_CAMPAIGN',
] as const;
export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number];

export const WORKFLOW_STATUSES = ['ACTIVE', 'PAUSED', 'DRAFT'] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const EXECUTION_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'REQUIRES_APPROVAL',
  'CANCELLED',
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const workflowActionSchema = z.object({
  type: z.enum(['SEND_COMMUNICATION', 'INTERNAL_ALERT']),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).default('WHATSAPP'),
  templateKey: z.string().trim().optional(),
  delayMinutes: z.number().int().min(0).default(0),
  messageBody: z.string().trim().optional(),
});
export type WorkflowAction = z.infer<typeof workflowActionSchema>;

export const createWorkflowSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/, 'Key must be alphanumeric with dashes/underscores'),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  triggerType: z.enum(WORKFLOW_TRIGGER_TYPES),
  status: z.enum(WORKFLOW_STATUSES).default('ACTIVE'),
  conditions: z.record(z.string(), z.any()).optional(),
  actions: z.array(workflowActionSchema).min(1, 'At least one action is required'),
  requiresApproval: z.boolean().default(false),
});
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = createWorkflowSchema.partial();
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

export const triggerWorkflowSchema = z.object({
  workflowKey: z.string().trim().min(1),
  patientId: z.uuid().optional(),
  payload: z.record(z.string(), z.any()).default({}),
  scheduledFor: z.iso.datetime().optional(),
});
export type TriggerWorkflowInput = z.infer<typeof triggerWorkflowSchema>;
