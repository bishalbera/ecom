import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Request } from 'express';

interface User {
  id: string;
  userId: string;
  sub: string;
}

interface RequestWithUser extends Request {
  user: User;
  grpcMetadata: Metadata;
}

@Injectable()
export class GrpcUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    console.log('User from request:', user);

    if (user) {
      const metadata = new Metadata();
      // Add user ID as string, not JSON stringified object
      metadata.add('user', user.id || user.userId || user.sub);

      // Store metadata in the execution context for the controller to use
      request.grpcMetadata = metadata;

      console.log('Metadata set:', metadata.getMap());
    }

    return next.handle();
  }
}
