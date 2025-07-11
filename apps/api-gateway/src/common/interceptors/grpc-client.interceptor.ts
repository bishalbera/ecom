import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class GrpcClientInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    
    // Create metadata from user info if available
    if (req.user) {
      const metadata = new Metadata();
      const userString = req.user.id || req.user.userId || req.user.sub || JSON.stringify(req.user);
      metadata.add('user', userString);
      
      // Store metadata in context
      context.getArgs()[1] = metadata;
    }

    return next.handle();
  }
}
