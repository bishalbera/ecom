import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  AddItemReq,
  AddItemRes,
  Cart,
  CART_SERVICE_NAME,
  CartServiceClient,
  ClearCartRes,
} from '@repo/proto/src/types/cart';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CartService implements OnModuleInit {
  private cartService: CartServiceClient;

  constructor(@Inject(CART_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.cartService =
      this.client.getService<CartServiceClient>(CART_SERVICE_NAME);
  }

  async GetCart(userId: string): Promise<Cart> {
    const cart = await firstValueFrom(this.cartService.getCart({ userId }));
    return {
      userId: cart.userId,
      items: cart.items,
    };
  }

  async AddItem(req: AddItemReq): Promise<AddItemRes> {
    const res = await firstValueFrom(this.cartService.addItem(req));
    return {
      msg: res.msg,
    };
  }

  async ClearCart(userId: string): Promise<ClearCartRes> {
    const res = await firstValueFrom(this.cartService.clearCart({ userId }));
    return {
      msg: res.msg,
    };
  }
}
