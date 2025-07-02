import { Controller, Post, Req, Headers, Body } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Post('create')
  async create(@Body() body: { orderId: string; amount: number }) {
    return this.paymentService.createPaymentIntent(body.orderId, body.amount);
  }

  @Post('webhook')
  async webhook(@Req() req: Request & { rawBody: Buffer }, @Headers() headers: Record<string, string>) {
    console.log('Headers:', headers);
    const signature = headers['stripe-signature'];

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const payload = req.rawBody;
    return this.paymentService.handleStripeWebhook(payload, signature);
  }
}
