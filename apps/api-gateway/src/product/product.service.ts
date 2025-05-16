import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Product,
  PRODUCT_SERVICE_NAME,
  ProductServiceClient,
  SearchReq,
} from '@repo/proto/src/types/product';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService implements OnModuleInit {
  private productService: ProductServiceClient;

  constructor(
    @Inject(PRODUCT_SERVICE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService =
      this.client.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
  }

  async GetProductById(id: string): Promise<Product> {
    const product = await firstValueFrom(
      this.productService.getProductById({ id }),
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      rating: product.rating,
      category: product.category,
    };
  }

  async SearchProducts(searchProductReq: SearchReq): Promise<Product[]> {
    const res = await firstValueFrom(
      this.productService.searchProducts(searchProductReq),
    );
    return res.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      stock: product.stock,
      price: product.price,
      rating: product.rating,
      category: product.category,
    }));
  }
}
