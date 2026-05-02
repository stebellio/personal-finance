import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClosureService } from "./services/closure.service";
import { ClosurePresenter } from "./presenters/closure.presenter";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";

@Controller()
@UseGuards(JwtAuthGuard)
export class ClosureController {
  constructor(private readonly closureService: ClosureService) {}

  @Post("accounts/:accountId/closures")
  async create(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
    @Body()
    body: {
      year: number;
      month: number;
      amount: number;
      note?: string;
    },
  ): Promise<ClosurePresenter> {
    const closure = await this.closureService.createClosure({
      accountId,
      userId: user.id,
      year: body.year,
      month: body.month,
      amount: body.amount,
      note: body.note,
    });
    return ClosurePresenter.fromModel(closure);
  }

  @Get("accounts/:accountId/closures")
  async listByAccount(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
  ): Promise<ClosurePresenter[]> {
    const closures = await this.closureService.getClosuresByAccount(
      accountId,
      user.id,
    );
    return closures.map((c) => ClosurePresenter.fromModel(c));
  }

  @Get("closures")
  async listByPeriod(
    @CurrentUser() user: AuthUser,
    @Query("year", ParseIntPipe) year: number,
    @Query("month", ParseIntPipe) month: number,
  ): Promise<ClosurePresenter[]> {
    const closures = await this.closureService.getClosuresByPeriod(
      user.id,
      year,
      month,
    );
    return closures.map((c) => ClosurePresenter.fromModel(c));
  }

  @Get("closures/:id")
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ClosurePresenter> {
    const closure = await this.closureService.getClosure(id, user.id);
    return ClosurePresenter.fromModel(closure);
  }

  @Patch("closures/:id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { amount?: number; note?: string | null },
  ): Promise<ClosurePresenter> {
    const closure = await this.closureService.updateClosure(id, user.id, body);
    return ClosurePresenter.fromModel(closure);
  }

  @Delete("closures/:id")
  async remove(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.closureService.removeClosure(id, user.id);
  }
}
