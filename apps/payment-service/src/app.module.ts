import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka/kafka.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [PaymentController],
  providers: [PaymentService, KafkaService],
})
export class AppModule {}
