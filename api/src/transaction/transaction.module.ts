import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { CategoryController } from "./category.controller";
import { TransactionService } from "./services/transaction.service";
import { CategoryService } from "./services/category.service";
import { TRANSACTION_REPOSITORY, TRANSACTION_STRATEGIES } from "./token";
import { PrismaTransactionRepository } from "./repositories/prismaTransaction.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";
import { ImportService } from "./services/import/import.service";
import { RevolutImportStrategy } from "./services/import/strategies/revolut.strategy";
import { IntesaSanPaoloImportStrategy } from "./services/import/strategies/intesa-san-paolo.strategy";

@Module({
  controllers: [TransactionController, CategoryController],
  providers: [
    TransactionService,
    CategoryService,
    ImportService,
    RevolutImportStrategy,
    IntesaSanPaoloImportStrategy,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
    {
      provide: TRANSACTION_STRATEGIES,
      useFactory: (
        revolut: RevolutImportStrategy,
        intesa: IntesaSanPaoloImportStrategy,
      ) => [revolut, intesa],
      inject: [RevolutImportStrategy, IntesaSanPaoloImportStrategy],
    },
  ],
  exports: [TransactionService, TRANSACTION_REPOSITORY],
})
export class TransactionModule {}
