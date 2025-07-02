
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from '../payment/payment.service';
import {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PAYMENT_SERVICE_NAME,
} from '@repo/proto/src/types/payment';

@Controller()
export class PaymentGrpcController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod(PAYMENT_SERVICE_NAME, 'CreatePaymentIntent')
  async createPaymentIntent(
    data: CreatePaymentIntentRequest,
  ): Promise<CreatePaymentIntentResponse> {
    const { orderId, amount } = data;
    const result = await this.paymentService.createPaymentIntent(orderId, amount);
    if (!result.clientSecret) {
      throw new Error('Failed to create payment intent: clientSecret is null');
    }
    return { clientSecret: result.clientSecret };
  }
}
