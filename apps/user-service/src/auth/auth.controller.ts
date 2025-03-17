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
@Controller()
@UserServiceControllerMethods()
export class AuthController implements UserServiceController {
  constructor(private readonly authService: AuthService) {}

  createUser(
    request: CreateUserRequest,
  ): Promise<User> | Observable<User> | User {
    return this.authService.createUser(request);
  }

  login(
    request: LoginRequest,
  ): Promise<LoginResult> | Observable<LoginResult> | LoginResult {
    return this.authService.login(request);
  }

  findUser(
    request: FindUserRequest,
  ):
    | Promise<FindUserResponse>
    | Observable<FindUserResponse>
    | FindUserResponse {
    return this.authService.findUser(request.email);
  }
}
