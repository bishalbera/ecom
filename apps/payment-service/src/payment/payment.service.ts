import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import {
  GetOrderReq,
  ORDER_SERVICE_NAME,
  OrderServiceClient,
} from '@repo/proto/src/types/order';
import { KafkaService } from 'src/kafka/kafka.service';
import Stripe from 'stripe';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private orderService: OrderServiceClient;

  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2025-04-30.basil' },
    );
  }

  onModuleInit() {
    this.orderService =
      this.grpcClient.getService<OrderServiceClient>(ORDER_SERVICE_NAME);
  }

  async createPaymentIntent(orderId: string) {
    const order = await firstValueFrom(
      this.orderService.getOrder({ id: orderId } as GetOrderReq),
    );
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'usd',
      metadata: { orderId: order.id },
    });
    return { clientSecret: paymentIntent.client_secret };
  }

  async handleSuccessfulPayment(event: Stripe.PaymentIntent) {
    const orderId = event.metadata?.orderId;
    if (!orderId) return;

    await this.kafkaService.send('order-events', {
      type: 'ORDER_PAID',
      orderId,
    });
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
      await this.handleSuccessfulPayment(paymentIntent);
    }
    return { received: true };
  }
}
