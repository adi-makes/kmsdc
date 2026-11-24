export type WorkflowTriggerType =
  | 'APPOINTMENT_SCHEDULED'
  | 'APPOINTMENT_REMINDER_DUE'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_NO_SHOW'
  | 'PATIENT_REGISTERED'
  | 'PATIENT_BIRTHDAY'
  | 'ROUTINE_RECALL_DUE'
  | 'MANUAL_CAMPAIGN';

export type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

export type ExecutionStatus =
  'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_APPROVAL' | 'CANCELLED';

export interface WorkflowActionConfig {
  type: 'SEND_COMMUNICATION' | 'INTERNAL_ALERT';
  channel?: 'WHATSAPP' | 'SMS' | 'EMAIL';
  templateKey?: string;
  delayMinutes?: number;
  messageBody?: string;
}
