import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  FindUserResponse,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '@repo/proto/src/types/user';

@Injectable()
export class UserService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  findUser(email: string): Observable<FindUserResponse> {
    return this.userService.findUser({ email });
  }
}
