import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientsModuleOptionsFactory,
  GrpcOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

@Injectable()
export class GrpcClientOptions implements ClientsModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  protoPath = join(__dirname, '/../../../packages/proto/user.proto');

  createClientOptions(): GrpcOptions {
    return {
      transport: Transport.GRPC,
      options: {
        url:
          this.configService.get<string>('USER_SERVICE_GRPC_URL') ||
          'localhost:5001',
        package: 'user',
        protoPath: this.protoPath,
      },
    };
  }
}
