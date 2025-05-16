import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';

@Module({
  imports: [],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class AppModule {}
