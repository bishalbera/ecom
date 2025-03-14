import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { USER_PACKAGE_NAME } from '@repo/proto/src/types/user';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const grpcPort = configService.getOrThrow('user_service_grpc_port');
  const protoPath = join(__dirname, '../../../../packages/proto/user.proto');

  console.log('User Service: Starting gRPC server...');
  console.log('gRPC Server Options:', {
    package: USER_PACKAGE_NAME,
    protoPath,
    url: `localhost:${grpcPort}`,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: USER_PACKAGE_NAME,
      protoPath: protoPath,
      url: `localhost:${grpcPort}`,
    },
  });

  try {
    await app.startAllMicroservices();
    console.log(`User Service: gRPC server is running on port ${grpcPort}`);

    await app.listen(port);
    console.log(`User Service: HTTP server is running on port ${port}`);
  } catch (error) {
    console.error('User Service: Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
