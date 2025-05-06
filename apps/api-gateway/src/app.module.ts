import { Module } from '@nestjs/common';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE_NAME } from '@repo/proto/src/types/user';
import { PRODUCT_SERVICE_NAME} from '@repo/proto/src/types/product'
import { join } from 'path';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';

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
  controllers: [UserController, ProductController],
  providers: [UserService, JwtStrategy,ProductService],
  exports: [],
})
export class AppModule {}
