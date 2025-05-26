import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
  const port = process.env.PORT;
  await app.listen(port ?? 3000);
  console.log(`Payments service is running on localhost:${port}`);
}
bootstrap();
