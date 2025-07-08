import { Controller, Post, Req, Headers, Body } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { Logger } from 'nestjs-pino';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: Logger,
  ) {}
  @Post('create')
  async create(@Body() body: { orderId: string; amount: number }) {
    this.logger.log('Creating payment intent', body);
    return this.paymentService.createPaymentIntent(body.orderId, body.amount);
  }

  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody: Buffer },
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Headers:', headers);
    const signature = headers['stripe-signature'];

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const payload = req.rawBody;
    return this.paymentService.handleStripeWebhook(payload, signature);
  }
}
