import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthInputDto } from './dto/auth-input';
import { SignInData } from 'src/types/signin-data';
import * as bcrypt from 'bcryptjs';
import { AuthResult } from 'src/types/auth-result';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  async validateUser(authInput: AuthInputDto): Promise<SignInData> {
    const user = await this.userService.findByEmail(authInput.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatched = await bcrypt.compare(
      authInput.password,
      user.password,
    );
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    } else {
      const { password, ...result } = user;
      return result;
    }
  }

  async signPayload(user: SignInData): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      name: user.name,
      email: user.email,
      id: user.id,
    };
  }

  async login(authInput: AuthInputDto): Promise<AuthResult> {
    const user = await this.validateUser(authInput);
    return this.signPayload(user);
  }
}
