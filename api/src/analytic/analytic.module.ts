import { Module } from "@nestjs/common";
import { AnalyticController } from "./analytic.controller";
import { AnalyticService } from "./services/analytic.service";
import { CLOSURE_REPOSITORY } from "../closure/token";
import { PrismaClosureRepository } from "../closure/repositories/prismaClosure.repository";

@Module({
  controllers: [AnalyticController],
  providers: [
    AnalyticService,
    {
      provide: CLOSURE_REPOSITORY,
      useClass: PrismaClosureRepository,
    },
  ],
})
export class AnalyticModule {}
