import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka/kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_SERVICE_NAME } from '@repo/proto/src/types/order';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, KafkaService],
})
export class AppModule {}
