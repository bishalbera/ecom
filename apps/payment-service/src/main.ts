import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(
    '/payments/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
  const port = process.env.PORT;
  const logger = app.get(Logger);
  await app.listen(port ?? 3000);
  logger.log(`Payments service is running on localhost:${port}`);
}
void bootstrap();
