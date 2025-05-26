import { Controller, Post, Req, Headers, Body } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Post('create')
  async create(@Body() body: { orderId: string }) {
    return this.paymentService.createPaymentIntent(body.orderId);
  }

  @Post('webhook')
  async webhook(@Req() req: Request, @Headers() headers: any) {
    console.log('Headers:', headers);
    const signature = headers['stripe-signature'];

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const payload = req.body;
    return this.paymentService.handleStripeWebhook(payload, signature);
  }
}
