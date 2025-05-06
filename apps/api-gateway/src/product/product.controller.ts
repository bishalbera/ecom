import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GrpcLoggingInterceptor } from 'src/grpc-logging.interceptor';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Product, SearchReq } from '@repo/proto/src/types/product';

@Controller('products')
@UseInterceptors(GrpcLoggingInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchProducts(@Query('query') query: any) {
    if (!query || query.trim() === '') {
      return NotFoundException;
    }

    const searchReq: SearchReq = {
      query: query.query || '',
      category: query.category || '',
      minPrice: parseFloat(query.minPrice) || 0,
      maxPrice: parseFloat(query.maxPrice) || 0,
      sort: query.sort || '',
      limit: parseInt(query.limit) || 10,
      page: parseInt(query.page) || 1,
    };

    const res = await this.productService.SearchProducts(searchReq);
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<Product> {
    const product = await this.productService.GetProductById(id);
    return product;
  }
}
