import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(
    @Body() body: { email: string; password: string },
  ): Promise<{ id: number }> {
    const id = await this.authService.register(body);

    return {
      id,
    };
  }

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }
}
