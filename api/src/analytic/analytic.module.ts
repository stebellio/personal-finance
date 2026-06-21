import { Module } from "@nestjs/common";
import { AnalyticController } from "./analytic.controller";
import { AnalyticService } from "./services/analytic.service";
import { TRANSACTION_REPOSITORY } from "../transaction/token";
import { PrismaTransactionRepository } from "../transaction/repositories/prismaTransaction.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";

@Module({
  controllers: [AnalyticController],
  providers: [
    AnalyticService,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
  ],
})
export class AnalyticModule {}
