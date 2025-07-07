import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { USER_PACKAGE_NAME } from '@repo/proto/src/types/user';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const grpcPort = configService.getOrThrow('user_service_grpc_port');
  const protoPath = join(__dirname, '../../../../packages/proto/user.proto');

  logger.log('User Service: Starting gRPC server...');
  logger.log(
    `gRPC Server Options: package=${USER_PACKAGE_NAME} protoPath=${protoPath} url=localhost:${grpcPort}`,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: USER_PACKAGE_NAME,
      protoPath: protoPath,

      url: `localhost:${grpcPort}`,
    },
  });

  try {
    void (await app.startAllMicroservices());
    logger.log(`User Service: gRPC server is running on port ${grpcPort}`);

    // await app.listen(port);
    // logger.log(`User Service: HTTP server is running on port ${port}`);
  } catch (error: any) {
    logger.error({ err: error }, 'User Service: Failed to start');
    process.exit(1);
  }
}

bootstrap();
