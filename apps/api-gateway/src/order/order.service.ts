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

interface User {
  id?: string;
  userId?: string;
  sub?: string;
}

interface RequestWithUser extends Request {
  user: User;
}

@Injectable({ scope: Scope.REQUEST })
export class OrderService {

  constructor(
    @Inject(ORDER_SERVICE_NAME) private readonly client: ClientGrpc,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {
  }

  async CreateOrder(req: CreateOrderReq): Promise<OrderRes> {
    const metadata = new Metadata();
    const user = this.request.user;
    if (user) {
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    
    // Use the raw client to make the call with metadata
    const client = this.client.getClientByServiceName(ORDER_SERVICE_NAME);
    const order: OrderRes = await new Promise((resolve, reject) => {
      client.createOrder(req, metadata, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
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
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    
    // Use the raw client to make the call with metadata
    const client = this.client.getClientByServiceName(ORDER_SERVICE_NAME);
    const order: OrderRes = await new Promise((resolve, reject) => {
      client.getOrder(req, metadata, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
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
      const userString =
        user.id || user.userId || user.sub || JSON.stringify(user);
      metadata.add('user', userString);
    }
    console.log('Metadata being sent to Order Service:', metadata.getMap());
    
    // Use the raw client to make the call with metadata
    const client = this.client.getClientByServiceName(ORDER_SERVICE_NAME);
    const orders: AllOrderRes = await new Promise((resolve, reject) => {
      client.getAllOrders(req, metadata, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
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
