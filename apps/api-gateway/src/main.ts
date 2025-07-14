import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { GrpcLoggingInterceptor } from './grpc-logging.interceptor';
import { GrpcExceptionFilter } from './grpc-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const logger = app.get(Logger);

  app.useGlobalFilters(new GrpcExceptionFilter());

  app.useGlobalInterceptors(new GrpcLoggingInterceptor(logger));

  try {
    await app.listen(port);
    const url = await app.getUrl();
    logger.log(`API Gateway is running at ${url}`);
  } catch (error) {
    logger.error('API Gateway: Failed to start services:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('API Gateway: Failed to start services:', error);
  process.exit(1);
});
