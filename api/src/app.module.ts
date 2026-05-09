import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AccountModule } from "./account/account.module";
import { ClosureModule } from "./closure/closure.module";
import { ConfigModule } from "@nestjs/config";
import { AnalyticModule } from './analytic/analytic.module';
import { GoalModule } from './goal/goal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountModule,
    ClosureModule,
    AnalyticModule,
    GoalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
