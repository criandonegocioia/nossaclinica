import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interceptor that automatically logs all mutation operations (POST, PUT, PATCH, DELETE)
 * to the audit_logs table for compliance and traceability.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const userId = request.user?.sub || null;
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const path = request.route?.path || request.url;

    // Extract entity info from the URL pattern
    const urlParts = request.url.split('/').filter(Boolean);
    const entityType = urlParts[1] || 'unknown'; // e.g., "patients", "schedules"
    const entityId = urlParts[2] || null;

    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              entityType,
              entityId: entityId || (responseData as Record<string, string>)?.id || 'unknown',
              action: actionMap[method] || method,
              newValue: method !== 'DELETE' ? (request.body || null) : null,
              userId,
              ip: String(ip),
              userAgent: String(userAgent),
            },
          });
        } catch {
          // Audit logging should never break the request
          console.error('Failed to write audit log');
        }
      }),
    );
  }
}
