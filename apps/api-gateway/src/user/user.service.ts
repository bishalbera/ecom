import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  User,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '@repo/proto/src/types/user';
import { CreateUserDto, LoginDto } from '@repo/shared-dtos/src/dtos';

@Injectable()
export class UserService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async findUser(email: string): Promise<User> {
    const user = await firstValueFrom(this.userService.findUser({ email }));
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return await firstValueFrom(this.userService.createUser(createUserDto));
  }

  login(loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }
}
