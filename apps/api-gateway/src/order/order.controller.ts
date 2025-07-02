import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GrpcLoggingInterceptor } from 'src/grpc-logging.interceptor';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import {
  AllOrderRes,
  CreateOrderReq,
  Empty,
  OrderRes,
} from '@repo/proto/src/types/order';
import { GrpcUserInterceptor } from 'src/common/interceptors/grpc-user.interceptor';
@Controller('orders')
@UseInterceptors(GrpcLoggingInterceptor, GrpcUserInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllOrders(req: Empty): Promise<AllOrderRes> {
    const orders = await this.orderService.GetAllOrders(req);
    return orders;
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Query('userId') userId: string,
    @Body() req: CreateOrderReq,
  ): Promise<OrderRes> {
    const order = await this.orderService.CreateOrder(req);
    return order;
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<OrderRes> {
    const order = await this.orderService.GetOrder({ id: id });
    return order;
  }
}
