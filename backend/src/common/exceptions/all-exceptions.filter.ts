import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as { message?: string }).message || 'An error occurred',
      ...(typeof message === 'object' && !(message instanceof Error)
        ? message
        : {}),
    };

    // Log error with context
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
        {
          path: request.url,
          method: request.method,
          body: request.body,
          query: request.query,
          params: request.params,
        },
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Error: ${errorResponse.message}`,
        {
          path: request.url,
          method: request.method,
        },
      );
    }

    response.status(status).json(errorResponse);
  }
}

