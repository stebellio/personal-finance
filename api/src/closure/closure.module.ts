import { Module } from '@nestjs/common';
import { ClosureController } from './closure.controller';
import { ClosureService } from './closure.service';

@Module({
  controllers: [ClosureController],
  providers: [ClosureService]
})
export class ClosureModule {}
