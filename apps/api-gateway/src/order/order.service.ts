import { Inject, Injectable, Scope } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { REQUEST } from '@nestjs/core';
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
import { Metadata } from '@grpc/grpc-js';
import { Request } from 'express';

interface User {
  id: string;
  userId: string;
  sub: string;
}

interface RequestWithUser extends Request {
  user: User;
}

@Injectable({ scope: Scope.REQUEST })
export class OrderService {
  private orderSerivice: OrderServiceClient;

  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly client: ClientGrpc,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {
    this.orderSerivice =
      this.client.getService<OrderServiceClient>(ORDER_SERVICE_NAME);
  }

  async CreateOrder(req: CreateOrderReq): Promise<OrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      metadata.add('user', user.id || user.userId || user.sub);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    const order: OrderRes = await firstValueFrom(
      this.orderSerivice.createOrder(req, metadata),
    );
    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      total: order.total,
      items: order.items,
      clientSecret: order.clientSecret,
    };
  }

  async GetOrder(req: GetOrderReq): Promise<OrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      metadata.add('user', user.id || user.userId || user.sub);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    const order: OrderRes = await firstValueFrom(
      this.orderSerivice.getOrder(req, metadata),
    );
    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      clientSecret: order.clientSecret,
      total: order.total,
      items: order.items,
    };
  }

  async GetAllOrders(req: Empty): Promise<AllOrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      metadata.add('user', user.id || user.userId || user.sub);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    const orders: AllOrderRes = await firstValueFrom(
      this.orderSerivice.getAllOrders(req, metadata),
    );
    return {
      orders: orders.orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        orderStatus: order.orderStatus,
        items: order.items,
        total: order.total,
        clientSecret: order.clientSecret,
      })),
    };
  }
}
