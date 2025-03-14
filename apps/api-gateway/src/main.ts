import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GrpcLoggingInterceptor } from './grpc-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  app.useGlobalInterceptors(new GrpcLoggingInterceptor());


  try {
    await app.listen(port);
    const url = await app.getUrl();
    console.log(`API Gateway is running at ${url}`);
  } catch (error) {
    console.error('API Gateway: Failed to start services:', error);
    process.exit(1);
  }
}
bootstrap();
