import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const isClientError = status >= 400 && status < 500;

    if (isClientError) {
      // 4xx — expected client errors, log as warn
      this.logger.warn(
        `[${status}] ${request.method} ${request.url} — ${message}`,
      );
    } else {
      // 5xx — unexpected server errors, log as error with full stack
      this.logger.error(
        `[${status}] ${request.method} ${request.url} — ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const responseBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message };

    response.status(status).json(
      typeof responseBody === 'object'
        ? { ...responseBody, timestamp: new Date().toISOString(), path: request.url }
        : { statusCode: status, message: responseBody, timestamp: new Date().toISOString(), path: request.url },
    );
  }
}
