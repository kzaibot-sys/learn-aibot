import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestWithId } from './request-id.middleware';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId & Request>();

    const status: HttpStatus =
      exception instanceof HttpException
        ? (exception.getStatus() as HttpStatus)
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.extractMessage(exceptionResponse);
    const code = this.extractCode(exceptionResponse, status);

    response.status(status).json({
      code,
      message,
      requestId: request.requestId ?? null,
    });
  }

  private extractMessage(responseBody: unknown): string {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (typeof responseBody === 'object' && responseBody !== null) {
      const candidate = (responseBody as { message?: unknown }).message;
      if (Array.isArray(candidate)) {
        return candidate.join(', ');
      }
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return 'Internal server error';
  }

  private extractCode(responseBody: unknown, status: HttpStatus): string {
    if (typeof responseBody === 'object' && responseBody !== null) {
      const candidate = (responseBody as { code?: unknown }).code;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
