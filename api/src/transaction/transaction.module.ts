import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { CategoryController } from "./category.controller";
import { TransactionService } from "./services/transaction.service";
import { CategoryService } from "./services/category.service";
import { TRANSACTION_REPOSITORY } from "./token";
import { PrismaTransactionRepository } from "./repositories/prismaTransaction.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";

@Module({
  controllers: [TransactionController, CategoryController],
  providers: [
    TransactionService,
    CategoryService,
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
