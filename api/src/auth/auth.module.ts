import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaAuthRepository } from "./repositories/prismaAuth.repository";
import { AUTH_REPOSITORY } from "./token";

@Module({
  imports: [ConfigModule, PrismaModule, JwtModule.register({})],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: AUTH_REPOSITORY,
      useClass: PrismaAuthRepository,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
