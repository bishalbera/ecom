import { Module } from '@nestjs/common';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE_NAME } from '@repo/proto/src/types/user';
import { PRODUCT_SERVICE_NAME } from '@repo/proto/src/types/product';
import { CART_SERVICE_NAME } from '@repo/proto/src/types/cart';
import { join } from 'path';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
      load: [configuration],
    }),
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_NAME,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url:
              configService.get<string>('USER_SERVICE_GRPC_URL') ||
              'localhost:5001',
            package: 'user',
            protoPath: join(__dirname, '/../../../packages/proto/user.proto'),
          },
        }),
      },
      {
        name: CART_SERVICE_NAME,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url:
              configService.get<string>('CART_SERVICE_GRPC_URL') ||
              'localhost:50054',
            package: 'cart',
            protoPath: join(__dirname, '/../../../packages/proto/cart.proto'),
          },
        }),
      },
      {
        name: PRODUCT_SERVICE_NAME,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url:
              configService.get<string>('PRODUCT_SERVICE_GRPC_URL') ||
              'localhost:50053',

            package: 'product',
            protoPath: join(
              __dirname,
              '/../../../packages/proto/product.proto',
            ),
          },
        }),
      },
    ]),
  ],
  controllers: [UserController, ProductController, CartController],
  providers: [UserService, JwtStrategy, ProductService, CartService],
  exports: [],
})
export class AppModule {}
