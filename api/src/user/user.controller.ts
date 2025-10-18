import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { UsersService } from './user.service';
import { User } from 'generated/prisma';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {
  }

  @Post()
  async createUser(
    @Body() data: { email: string; password: string },
  ): Promise<User> {
    return this.userService.createUser(data);
  }

  @Post('login')
  async login(
    @Body() data: { email: string; password: string },
  ): Promise<number> {
    const user = await this.userService.user({ email: '<EMAIL>' });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.id;
  }
}
