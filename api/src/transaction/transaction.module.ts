import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./services/transaction.service";
import { TRANSACTION_REPOSITORY } from "./token";
import { PrismaTransactionRepository } from "./repositories/prismaTransaction.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";

@Module({
  controllers: [TransactionController],
  providers: [
    TransactionService,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
  ],
  exports: [TransactionService, TRANSACTION_REPOSITORY],
})
export class TransactionModule {}
