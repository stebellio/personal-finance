import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './services/account.service';
import {ACCOUNT_REPOSITORY} from "./token";
import {PrismaAccountRepository} from "./repositories/prismaAccount.repository";

@Module({
  controllers: [AccountController],
  providers: [AccountService, {
    provide: ACCOUNT_REPOSITORY,
    useClass: PrismaAccountRepository
  }]
})
export class AccountModule {}
