import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AccountModule } from "./account/account.module";
import { ConfigModule } from "@nestjs/config";
import { AnalyticModule } from "./analytic/analytic.module";
import { GoalModule } from "./goal/goal.module";
import { PropertyModule } from "./property/property.module";
import { TransactionModule } from "./transaction/transaction.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountModule,
    AnalyticModule,
    GoalModule,
    PropertyModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
