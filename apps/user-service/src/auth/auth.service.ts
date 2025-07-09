import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInData } from 'src/types/signin-data';
import * as bcrypt from 'bcryptjs';
import { AuthResult } from 'src/types/auth-result';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from '@repo/shared-dtos/src/dtos/create-user.dto';
import { LoginDto } from '@repo/shared-dtos/src/dtos/login.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js'; 
import { Logger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    this.logger.log({ createUserDto }, 'Creating user');
    try {
      const userExist = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (userExist) {
        this.logger.error(
          { email: createUserDto.email },
          'Email already registered',
        );
        throw new RpcException({
          code: status.ALREADY_EXISTS, // ✅ Use correct gRPC status (409 Conflict)
          message: 'Email is already registered',
        });
      }

      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
      const user = await this.prisma.user.create({ data: createUserDto });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      this.logger.log({ result }, 'User created successfully');
      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error({ error }, 'Error creating user');
      throw error;
    }
  }

  async findUser(email: string) {
    this.logger.log({ email }, 'Finding user');
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.error({ email }, 'User not found');
        throw new RpcException({
          code: status.NOT_FOUND, // ✅ Use NOT_FOUND (404)
          message: `User with email ${email} does not exist`,
        });
      }

      this.logger.log({ user }, 'User found');
      return user;
    } catch (error ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error({ error }, 'Error finding user');
      throw error;
    }
  }

  async login(authInput: LoginDto) {
    this.logger.log({ authInput }, 'Logging in user');
    try {
      const user = await this.validateUser(authInput);
      const result = this.signPayload(user);
      this.logger.log({ result }, 'User logged in successfully');
      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error({ error }, 'Error logging in user');
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  signPayload(user: SignInData): AuthResult {
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
