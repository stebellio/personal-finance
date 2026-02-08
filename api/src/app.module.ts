import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import {ConfigModule} from "@nestjs/config";
import { ClosureModule } from './closure/closure.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), PrismaModule, AuthModule, AccountModule, ClosureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
