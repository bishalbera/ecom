import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/dto/create-user.dto';
import {
  FindUserRequest,
  UserServiceController,
  UserServiceControllerMethods,
} from '@repo/proto/src/types/user';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  constructor(private readonly userService: UserService) {}

  findUser(findUserReq: FindUserRequest) {
    return this.userService.findUser(findUserReq.email);
  }
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async findByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
