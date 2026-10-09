import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = request.user?.id || request.user?._id || 'unauthenticated';
    const startTime = Date.now();

    this.logger.log(
      `Incoming  ▶ ${method} ${url} | IP: ${ip} | Agent: ${userAgent} | User: ${userId}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          this.logger.log(
            `Completed ✔ ${method} ${url} | ${statusCode} | ${duration}ms | User: ${userId}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || error?.statusCode || 500;
          this.logger.warn(
            `Failed    ✘ ${method} ${url} | ${statusCode} | ${duration}ms | User: ${userId} | Error: ${error?.message}`,
          );
        },
      }),
    );
  }
}
