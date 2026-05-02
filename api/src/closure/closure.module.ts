import { Module } from "@nestjs/common";
import { ClosureController } from "./closure.controller";
import { ClosureService } from "./services/closure.service";
import { CLOSURE_REPOSITORY } from "./token";
import { PrismaClosureRepository } from "./repositories/prismaClosure.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";

@Module({
  controllers: [ClosureController],
  providers: [
    ClosureService,
    {
      provide: CLOSURE_REPOSITORY,
      useClass: PrismaClosureRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
  ],
})
export class ClosureModule {}
