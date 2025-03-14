import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { GrpcLoggingInterceptor } from 'src/grpc-logging.interceptor';
import { UserService } from './user.service';
import { FindUserResponse } from '@repo/proto/src/types/user';

@Controller('users')
@UseInterceptors(GrpcLoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':email')
  async findUser(@Param('email') email: string): Promise<FindUserResponse> {
    const user = await this.userService.findUser(email).toPromise();

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }
}
