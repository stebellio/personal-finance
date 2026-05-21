import { PassportStrategy } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { AuthUser } from "./models/authUser.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(args: { id: number }): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: args.id } });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
