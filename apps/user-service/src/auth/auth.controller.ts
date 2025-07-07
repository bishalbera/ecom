import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateUserRequest,
  FindUserRequest,
  FindUserResponse,
  LoginRequest,
  LoginResult,
  User,
  UserServiceController,
  UserServiceControllerMethods,
} from '@repo/proto/src/types/user';
import { Observable } from 'rxjs';
import { Logger } from 'nestjs-pino';

@Controller()
@UserServiceControllerMethods()
export class AuthController implements UserServiceController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) {}

  createUser(
    request: CreateUserRequest,
  ): Promise<User> | Observable<User> | User {
    this.logger.log({ request }, 'Creating user');
    return this.authService.createUser(request);
  }

  login(
    request: LoginRequest,
  ): Promise<LoginResult> | Observable<LoginResult> | LoginResult {
    this.logger.log({ request }, 'Logging in user');
    return this.authService.login(request);
  }

  findUser(
    request: FindUserRequest,
  ):
    | Promise<FindUserResponse>
    | Observable<FindUserResponse>
    | FindUserResponse {
    this.logger.log({ request }, 'Finding user');
    return this.authService.findUser(request.email);
  }
}
