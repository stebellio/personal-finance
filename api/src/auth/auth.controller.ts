import {Controller, Post, Body, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import {AuthGuard} from "./auth.guard";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('AuthController');
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string;}) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }
}