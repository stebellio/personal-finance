import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";
import { GoalService } from "./services/goal.service";
import { GoalPresenter } from "./presenters/goal.presenter";

@Controller()
@UseGuards(JwtAuthGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post("accounts/:accountId/goals")
  async create(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
    @Body() body: { name: string; target: number },
  ): Promise<GoalPresenter> {
    const goal = await this.goalService.createGoal({
      accountId,
      userId: user.id,
      name: body.name,
      target: body.target,
    });
    return GoalPresenter.fromModel(goal);
  }

  @Get("accounts/:accountId/goals")
  async listByAccount(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
  ): Promise<GoalPresenter[]> {
    const goals = await this.goalService.getGoalsByAccount(accountId, user.id);
    return goals.map((g) => GoalPresenter.fromModel(g));
  }

  @Get("goals")
  async list(@CurrentUser() user: AuthUser): Promise<GoalPresenter[]> {
    const goals = await this.goalService.getGoals(user.id);
    return goals.map((g) => GoalPresenter.fromModel(g));
  }

  @Get("goals/:id")
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<GoalPresenter> {
    const goal = await this.goalService.getGoal(id, user.id);
    return GoalPresenter.fromModel(goal);
  }

  @Patch("goals/:id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: { name?: string; target?: number; completedAt?: Date | null },
  ): Promise<GoalPresenter> {
    const goal = await this.goalService.updateGoal(id, user.id, body);
    return GoalPresenter.fromModel(goal);
  }

  @Delete("goals/:id")
  async remove(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.goalService.removeGoal(id, user.id);
  }
}
