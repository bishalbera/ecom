import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ORDER_SERVICE_NAME,
  OrderServiceClient,
  UpdateOrderStatusReq,
} from '@repo/proto/src/types/order';
import { KafkaService } from 'src/kafka/kafka.service';
import Stripe from 'stripe';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private orderService: OrderServiceClient;

  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
    private readonly logger: Logger,
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

  async createPaymentIntent(orderId: string, amount: number) {
    this.logger.log(
      `Creating payment intent for order ${orderId} with amount ${amount}`,
    );
    const order = await firstValueFrom(
      this.orderService.getOrder({ id: orderId }),
    );
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { orderId: order.id },
    });
    return { clientSecret: paymentIntent.client_secret };
  }

  async handleSuccessfulPayment(event: Stripe.PaymentIntent) {
    const orderId = event.metadata?.orderId;
    if (!orderId) return;

    this.logger.log(`Handling successful payment for order ${orderId}`);

    await this.kafkaService.send('order-events', {
      key: orderId,
      value: { type: 'ORDER_PAID', orderId },
    });

    // Call order service to update order status
    await firstValueFrom(
      this.orderService.updateOrderStatus({
        orderId: orderId,
        status: 'PAID',
      } as UpdateOrderStatusReq),
    );
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
      if (err instanceof Error) {
        this.logger.error(`Webhook Error: ${err.message}`);
        throw new Error(`Webhook Error: ${err.message}`);
      }
      this.logger.error('Webhook Error: An unknown error occurred');
      throw new Error('Webhook Error: An unknown error occurred');
    }
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Send kafka message to update order status
      await this.handleSuccessfulPayment(paymentIntent);
    }
    return { received: true };
  }
}
