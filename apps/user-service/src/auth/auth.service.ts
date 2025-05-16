import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInData } from 'src/types/signin-data';
import * as bcrypt from 'bcryptjs';
import { AuthResult } from 'src/types/auth-result';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from '@repo/shared-dtos/src/dtos/create-user.dto';
import { LoginDto } from '@repo/shared-dtos/src/dtos/login.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js'; // ✅ Import gRPC status codes

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (userExist) {
        throw new RpcException({
          code: status.ALREADY_EXISTS, // ✅ Use correct gRPC status (409 Conflict)
          message: 'Email is already registered',
        });
      }

      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
      const user = await this.prisma.user.create({ data: createUserDto });

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findUser(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new RpcException({
          code: status.NOT_FOUND, // ✅ Use NOT_FOUND (404)
          message: `User with email ${email} does not exist`,
        });
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(authInput: LoginDto) {
    try {
      const user = await this.validateUser(authInput);
      return this.signPayload(user);
    } catch (error) {
      throw error;
    }
  }

  async validateUser(authInput: LoginDto): Promise<SignInData> {
    const user = await this.prisma.user.findUnique({
      where: { email: authInput.email },
    });

    if (!user) {
      throw new RpcException({
        code: status.UNAUTHENTICATED, // ✅ Use UNAUTHENTICATED (401)
        message: 'Invalid credentials',
      });
    }

    const passwordMatched = await bcrypt.compare(
      authInput.password,
      user.password,
    );

    if (!passwordMatched) {
      throw new RpcException({
        code: status.UNAUTHENTICATED, // ✅ Incorrect password → 401
        message: 'Invalid credentials',
      });
    }

    const { password, ...result } = user;
    return result;
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
}
