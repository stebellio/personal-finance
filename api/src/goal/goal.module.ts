import { Module } from "@nestjs/common";
import { GoalController } from "./goal.controller";
import { GoalService } from "./services/goal.service";
import { GOAL_REPOSITORY } from "./token";
import { PrismaGoalRepository } from "./repositories/prismaGoal.repository";
import { ACCOUNT_REPOSITORY } from "../account/token";
import { PrismaAccountRepository } from "../account/repositories/prismaAccount.repository";

@Module({
  controllers: [GoalController],
  providers: [
    GoalService,
    {
      provide: GOAL_REPOSITORY,
      useClass: PrismaGoalRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
  ],
})
export class GoalModule {}
