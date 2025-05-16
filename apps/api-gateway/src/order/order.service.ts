import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  AllOrderRes,
  CreateOrderReq,
  Empty,
  GetOrderReq,
  ORDER_SERVICE_NAME,
  OrderRes,
  OrderServiceClient,
} from '@repo/proto/src/types/order';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService implements OnModuleInit {
  private orderSerivice: OrderServiceClient;
  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderSerivice =
      this.client.getService<OrderServiceClient>(ORDER_SERVICE_NAME);
  }

  async CreateOrder(req: CreateOrderReq): Promise<OrderRes> {
    const order = await firstValueFrom(this.orderSerivice.createOrder(req));

    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      total: order.total,
      items: order.items,
    };
  }

  async GetOrder(req: GetOrderReq): Promise<OrderRes> {
    const order = await firstValueFrom(this.orderSerivice.getOrder(req));
    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      total: order.total,
      items: order.items,
    };
  }

  async GetAllOrders(req: Empty): Promise<AllOrderRes> {
    const orders = await firstValueFrom(this.orderSerivice.getAllOrders(req));

    return {
      orders: orders.orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        orderStatus: order.orderStatus,
        items: order.items,
        total: order.total,
      })),
    };
  }
}
