import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { ConfigModule } from '@nestjs/config';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_SERVICE_NAME } from '@repo/proto/src/types/order';
import { join } from 'path';
import { PAYMENT_SERVICE_NAME } from '@repo/proto/src/types/payment';
import { KafkaService } from './kafka/kafka.service';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ClientsModule.register([
      {
        name: ORDER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50055',
          package: 'order',
          protoPath: join(__dirname, '../../../packages/proto/order.proto'),
        },
      },
      {
        name: PAYMENT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50056',
          package: 'payment',
          protoPath: join(__dirname, '../../../packages/proto/payment.proto'),
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, KafkaService],
})
export class AppModule {}
