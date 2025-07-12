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
import { Metadata } from '@grpc/grpc-js';
import { Request } from 'express';
import { lastValueFrom, Observable } from 'rxjs';

interface User {
  id?: string;
  userId?: string;
  sub?: string;
}

interface RequestWithUser extends Request {
  user: User;
}
interface OrderServiceClientWithMetadata extends OrderServiceClient {
  createOrder(
    request: CreateOrderReq,
    metadata?: Metadata,
  ): Observable<OrderRes>;
  getOrder(request: GetOrderReq, metadata?: Metadata): Observable<OrderRes>;
  getAllOrders(request: Empty, metadata?: Metadata): Observable<AllOrderRes>;
}

@Injectable({ scope: Scope.REQUEST })
export class OrderService {
  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly client: ClientGrpc,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  async CreateOrder(req: CreateOrderReq): Promise<OrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());

    const client =
      this.client.getService<OrderServiceClientWithMetadata>(
        ORDER_SERVICE_NAME,
      );

    return await lastValueFrom(client.createOrder(req, metadata));
  }

  async GetOrder(req: GetOrderReq): Promise<OrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());

    const client =
      this.client.getService<OrderServiceClientWithMetadata>(
        ORDER_SERVICE_NAME,
      );
    return await lastValueFrom(client.getOrder(req, metadata));
  }

  async GetAllOrders(req: Empty): Promise<AllOrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());

    const client =
      this.client.getService<OrderServiceClientWithMetadata>(
        ORDER_SERVICE_NAME,
      );

    return await lastValueFrom(client.getAllOrders(req, metadata));
  }
}
