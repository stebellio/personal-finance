import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticService } from "./services/analytic.service";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";
import { NetWorthHistoryQueryDto } from "./dto/netWorthHistoryQuery.dto";
import { NetWorthHistoryPresenter } from "./presenters/netWorthHistory.presenter";
import { NetWorthProjectionPresenter } from "./presenters/netWorthProjection.presenter";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticController {
  constructor(private readonly analyticService: AnalyticService) {}

  @Get("net-worth-history")
  async getNetWorthHistory(
    @CurrentUser() user: AuthUser,
    @Query() dto: NetWorthHistoryQueryDto,
  ) {
    const periods = await this.analyticService.getNetWorthHistory(
      user.id,
      dto.period,
    );

    return periods.map((p) => NetWorthHistoryPresenter.fromModel(p));
  }

  @Get("net-worth-projection")
  async getNetWorthProjection(@CurrentUser() user: AuthUser) {
    const projection = await this.analyticService.getNetWorthProjection(
      user.id,
    );
    return NetWorthProjectionPresenter.fromModel(projection);
  }
}
