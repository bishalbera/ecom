import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async create(@Body() body: { orderId: string; amount: number }) {
    return this.paymentService.createPaymentIntent(body.orderId, body.amount);
  }
  @Post('webhook')
  async webhook(@Req() req, @Headers('stripe-signature') signature: string) {
    const payload = req.rawBody;
    return this.paymentService.handleStripeWebhook(payload, signature);
  }
}
