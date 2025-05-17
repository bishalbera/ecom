import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from 'src/kafka/kafka.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2025-04-30.basil' },
    );
  }

  async createPaymentIntent(orderId: string, amount: number, currency = 'usd') {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { orderId },
    });
    return { clientSecret: paymentIntent.client_secret };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const endpointSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      // Send kafka message to update order status
      await this.kafkaService.send('order-events', {
        key: orderId,
        value: {
          eventType: 'ORDER_PAID',
          orderId,
        },
      });
    }
    return { received: true };
  }
}
