import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiError } from '@kmsdc/validation';
import type { Request, Response } from 'express';

const STATUS_CODES: Partial<Record<number, string>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'BUSINESS_RULE_VIOLATION',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Domain errors can carry a machine-readable code by throwing an HttpException whose
 * response object is `{ code, message, details? }`.
 */
interface CodedResponse {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

function isDetails(value: unknown): value is { path: string; issue: string }[] {
  return (
    Array.isArray(value) &&
    value.every(
      (d: unknown) =>
        typeof d === 'object' &&
        d !== null &&
        typeof (d as { path?: unknown }).path === 'string' &&
        typeof (d as { issue?: unknown }).issue === 'string',
    )
  );
}

/** Converts every thrown error into the documented error envelope (docs/api/api-conventions.md). */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: { path: string; issue: string }[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? `HTTP_${status}`;
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object') {
        const coded = body as CodedResponse;
        if (typeof coded.code === 'string') code = coded.code;
        if (typeof coded.message === 'string') message = coded.message;
        else if (Array.isArray(coded.message)) message = coded.message.join('; ');
        if (isDetails(coded.details)) details = coded.details;
      }
    } else {
      // Unknown errors: log full detail server-side, expose nothing internal.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const payload: ApiError = {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        ...(request.id ? { requestId: request.id } : {}),
      },
    };
    response.status(status).json(payload);
  }
}
