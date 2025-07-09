import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { GrpcLoggingInterceptor } from 'src/grpc-logging.interceptor';
import { UserService } from './user.service';
import { User } from '@repo/proto/src/types/user';
import { CreateUserDto } from '@repo/shared-dtos/src/dtos/create-user.dto';
import { LoginDto } from '@repo/shared-dtos/src/dtos/login.dto';

@Controller('users')
@UseInterceptors(GrpcLoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findUser(@Query('email') email: string): Promise<User> {
    const user = await this.userService.findUser(email);

    return user;
  }

  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }
}
