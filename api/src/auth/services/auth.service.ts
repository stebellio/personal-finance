import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import type { IAuthRepository } from "../repositories/authRepository.interface";
import { AUTH_REPOSITORY } from "../token";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  login(user: { id: number; email: string }) {
    return this.generateTokens({ id: user.id, email: user.email });
  }

  async refresh(refreshToken: string) {
    let payload: { id: number; email: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.authRepository.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.generateTokens({ id: user.id, email: user.email });
  }

  async register(data: { email: string; password: string; name?: string }) {
    const user = await this.authRepository.findByEmail(data.email);

    if (user) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.authRepository.create({ ...data, password: hashedPassword });
  }

  private generateTokens(payload: { id: number; email: string }) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      expiresIn: this.configService.getOrThrow("JWT_ACCESS_EXPIRES_IN"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.getOrThrow("JWT_REFRESH_EXPIRES_IN"),
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
