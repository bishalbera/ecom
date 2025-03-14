import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from 'src/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
      const user = await this.prismaService.user.create({
        data: createUserDto,
      });
      const { password, ...result } = user;
      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  async findUser(email: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found ');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
