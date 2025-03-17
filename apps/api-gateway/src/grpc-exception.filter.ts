import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Response } from 'express';

@Catch() // ✅ Catch ALL exceptions, not just RpcException
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.error('🔥 GrpcExceptionFilter Caught Exception:', exception);

    let grpcCode = status.UNKNOWN; // Default gRPC status code
    let message = 'Internal Server Error';

    // ✅ If the exception is RpcException, extract error details
    if (exception instanceof RpcException) {
      const error: any = exception.getError();
      grpcCode = error?.code || status.UNKNOWN;
      message = error?.message || 'Internal Server Error';
    } else if (exception.code !== undefined) {
      // ✅ Some gRPC errors are not RpcException, check `exception.code`
      grpcCode = exception.code;
      message =
        exception.details || exception.message || 'Internal Server Error';
    }

    // ✅ gRPC to HTTP status mapping
    const httpStatus = this.mapGrpcToHttpStatus(grpcCode);

    console.error(
      `🔥 Mapped gRPC Error (${grpcCode}) → HTTP ${httpStatus}: ${message}`,
    );

    response.status(httpStatus).json({
      statusCode: httpStatus,
      message,
    });
  }

  private mapGrpcToHttpStatus(grpcCode: number): number {
    switch (grpcCode) {
      case status.OK:
        return HttpStatus.OK; // 200
      case status.CANCELLED:
        return HttpStatus.BAD_REQUEST; // 400
      case status.UNKNOWN:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
      case status.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST; // 400
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.GATEWAY_TIMEOUT; // 504
      case status.NOT_FOUND:
        return HttpStatus.NOT_FOUND; // 404
      case status.ALREADY_EXISTS:
        return HttpStatus.CONFLICT; // 409
      case status.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN; // 403
      case status.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED; // 401
      case status.RESOURCE_EXHAUSTED:
        return HttpStatus.TOO_MANY_REQUESTS; // 429
      case status.FAILED_PRECONDITION:
        return HttpStatus.PRECONDITION_FAILED; // 412
      case status.ABORTED:
        return HttpStatus.CONFLICT; // 409
      case status.OUT_OF_RANGE:
        return HttpStatus.BAD_REQUEST; // 400
      case status.UNIMPLEMENTED:
        return HttpStatus.NOT_IMPLEMENTED; // 501
      case status.INTERNAL:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
      case status.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE; // 503
      case status.DATA_LOSS:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500
    }
  }
}
