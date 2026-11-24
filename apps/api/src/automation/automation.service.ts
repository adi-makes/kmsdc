import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CommunicationService } from '../communication/communication.service.js';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  TriggerWorkflowInput,
  WorkflowAction,
} from '@kmsdc/validation';

@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly communicationService: CommunicationService,
  ) {}

  async listWorkflows(clinicId: string) {
    return this.prisma.workflowDefinition.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });
  }

  async getWorkflow(id: string, clinicId: string) {
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
        executions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workflow || workflow.clinicId !== clinicId) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async createWorkflow(input: CreateWorkflowInput, clinicId: string, actorId?: string) {
    const existing = await this.prisma.workflowDefinition.findUnique({
      where: { key: input.key },
    });
    if (existing) {
      throw new BadRequestException(`Workflow with key '${input.key}' already exists`);
    }

    const workflow = await this.prisma.workflowDefinition.create({
      data: {
        clinicId,
        key: input.key,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        status: input.status,
        conditions: input.conditions,
        actions: input.actions,
        requiresApproval: input.requiresApproval,
      },
    });

    if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'workflows.create',
        entityType: 'WorkflowDefinition',
        entityId: workflow.id,
        changes: { key: input.key, name: input.name },
      });
    }

    return workflow;
  }

  async updateWorkflow(id: string, clinicId: string, input: UpdateWorkflowInput, actorId?: string) {
    await this.getWorkflow(id, clinicId);

    const updated = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        conditions: input.conditions as Prisma.InputJsonValue | undefined,
        actions: input.actions ? (input.actions as unknown as Prisma.InputJsonValue) : undefined,
        requiresApproval: input.requiresApproval,
      },
    });

    if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'workflows.update',
        entityType: 'WorkflowDefinition',
        entityId: id,
        changes: input,
      });
    }

    return updated;
  }

  async triggerWorkflow(input: TriggerWorkflowInput, clinicId: string, actorId?: string) {
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { key: input.workflowKey },
    });

    if (!workflow || workflow.clinicId !== clinicId) {
      throw new NotFoundException(`Workflow '${input.workflowKey}' not found`);
    }

    if (workflow.status !== 'ACTIVE') {
      throw new BadRequestException(`Workflow '${workflow.name}' is currently ${workflow.status}`);
    }

    const idempotencyKey = `${workflow.key}_${input.patientId ?? 'clinic'}_${Date.now()}`;
    const initialStatus = workflow.requiresApproval ? 'REQUIRES_APPROVAL' : 'PENDING';

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        clinicId,
        patientId: input.patientId,
        status: initialStatus,
        triggerPayload: input.payload as Prisma.InputJsonValue,
        idempotencyKey,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
      },
    });

    if (!workflow.requiresApproval) {
      // Execute immediately for synchronous simulation / test purposes
      await this.executeWorkflowRun(execution.id, clinicId);
    } else if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'workflows.triggered_pending_approval',
        entityType: 'WorkflowExecution',
        entityId: execution.id,
        changes: { idempotencyKey },
      });
    }

    return this.prisma.workflowExecution.findUniqueOrThrow({
      where: { id: execution.id },
    });
  }

  async approveExecution(id: string, clinicId: string, actorId: string) {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id },
      include: { workflow: true },
    });

    if (!execution || execution.clinicId !== clinicId) {
      throw new NotFoundException('Execution not found');
    }

    if (execution.status !== 'REQUIRES_APPROVAL') {
      throw new BadRequestException(`Cannot approve execution in ${execution.status} status`);
    }

    await this.prisma.workflowExecution.update({
      where: { id },
      data: {
        status: 'PENDING',
        approvedAt: new Date(),
        approvedById: actorId,
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'workflows.approve',
      entityType: 'WorkflowExecution',
      entityId: id,
      changes: { status: 'PENDING', approvedAt: new Date() },
    });

    return this.executeWorkflowRun(id, clinicId);
  }

  async executeWorkflowRun(executionId: string, clinicId: string) {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });

    if (!execution || execution.clinicId !== clinicId) {
      throw new NotFoundException('Execution not found');
    }

    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING', attempts: { increment: 1 } },
    });

    try {
      const actions = execution.workflow.actions as unknown as WorkflowAction[];
      const results: unknown[] = [];

      for (const action of actions) {
        if (action.type === 'SEND_COMMUNICATION' && execution.patientId) {
          const patient = await this.prisma.patient.findUniqueOrThrow({
            where: { id: execution.patientId },
          });

          // Check or create conversation
          let conversation = await this.prisma.conversation.findFirst({
            where: {
              clinicId,
              patientId: patient.id,
              channel: action.channel,
            },
          });

          if (!conversation) {
            conversation = await this.communicationService.createConversation(
              {
                patientId: patient.id,
                channel: action.channel,
                contactPoint: patient.primaryPhone,
                subject: execution.workflow.name,
              },
              clinicId,
            );
          }

          const sent = await this.communicationService.sendMessage(conversation.id, clinicId, {
            body: action.messageBody ?? `[Automated] ${execution.workflow.name}`,
            templateKey: action.templateKey,
            category: 'OPERATIONAL',
          });

          results.push({
            action: 'SEND_COMMUNICATION',
            messageId: sent.id,
            status: sent.deliveryStatus,
          });
        }
      }

      return await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          executedAt: new Date(),
          resultPayload: results as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          lastError: message,
        },
      });
    }
  }

  async listExecutions(
    clinicId: string,
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_APPROVAL' | 'CANCELLED',
  ) {
    return this.prisma.workflowExecution.findMany({
      where: {
        clinicId,
        status,
      },
      include: {
        workflow: {
          select: { key: true, name: true, triggerType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
