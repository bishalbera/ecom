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
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer'; // Added import

class SearchQueryDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumberString()
  @IsOptional()
  @Type(() => Number) // Added decorator
  minPrice?: number; // Changed type to number

  @IsNumberString()
  @IsOptional()
  @Type(() => Number) // Added decorator
  maxPrice?: number; // Changed type to number

  @IsString()
  @IsOptional()
  sort?: string;

  @IsNumberString()
  @IsOptional()
  @Type(() => Number) // Added decorator
  limit?: number; // Changed type to number

  @IsNumberString()
  @IsOptional()
  @Type(() => Number) // Added decorator
  page?: number; // Changed type to number
}

@Controller('products')
@UseInterceptors(GrpcLoggingInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchProducts(@Query() query: SearchQueryDto) {
    // Allow search by category, query, or other filters - at least one should be provided
    if ((!query.query || query.query.trim() === '') && 
        (!query.category || query.category.trim() === '') &&
        !query.minPrice && !query.maxPrice) {
      throw new NotFoundException('At least one search parameter (query, category, minPrice, or maxPrice) is required');
    }

    const searchReq: SearchReq = {
      query: query.query || '',
      category: query.category || '',
      minPrice: query.minPrice || 0,
      maxPrice: query.maxPrice || 0,
      sort: query.sort || '',
      limit: query.limit || 10,
      page: query.page || 1,
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
