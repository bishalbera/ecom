import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GrpcLoggingInterceptor } from 'src/grpc-logging.interceptor';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import {
  AddItemReq,
  AddItemRes,
  Cart,
  ClearCartRes,
} from '@repo/proto/src/types/cart';

@Controller('cart')
@UseInterceptors(GrpcLoggingInterceptor)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async GetCart(@Param('userId') userId: string): Promise<Cart> {
    const cart = await this.cartService.GetCart(userId);
    return cart;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  async AddItem(
    @Param('userId') userId: string,
    @Body() addItemReq: AddItemReq,
  ): Promise<AddItemRes> {
    const req = {
      ...addItemReq,
      userId,
    };
    const res = await this.cartService.AddItem(req);
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async ClearCart(@Param('userId') userId: string): Promise<ClearCartRes> {
    const res = await this.cartService.ClearCart(userId);
    return res;
  }
}
