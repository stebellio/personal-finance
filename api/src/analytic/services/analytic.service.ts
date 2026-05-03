import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CLOSURE_REPOSITORY } from "../../closure/token";
import type { IClosureRepository } from "../../closure/repositories/closureRepository.interface";
import { ClosurePeriod } from "../models/ClosurePeriod.model";
import { Period } from "../enum/period.enum";

@Injectable()
export class AnalyticService {
  constructor(
    @Inject(CLOSURE_REPOSITORY)
    private readonly closureRepository: IClosureRepository,
  ) {}

  async getNetWorthHistory(
    userId: number,
    period: Period,
  ): Promise<ClosurePeriod[]> {
    const closurePeriods = this.buildEmptyClosurePeriod(period);
    const firstClosurePeriod = closurePeriods[0];
    const lastClosurePeriod = closurePeriods[closurePeriods.length - 1];

    const closures = await this.closureRepository.findByUserIdAndRange(
      userId,
      {
        year: firstClosurePeriod.year,
        month: firstClosurePeriod.month,
      },
      {
        year: lastClosurePeriod.year,
        month: lastClosurePeriod.month,
      },
    );

    if (!closures.length) {
      return closurePeriods;
    }

    const periodMap = new Map(
      closurePeriods.map((cp) => [`${cp.year}-${cp.month}`, cp]),
    );

    for (const closure of closures) {
      const cp = periodMap.get(`${closure.year}-${closure.month}`);
      if (cp) {
        cp.amount = (cp.amount ?? 0) + closure.amount;
      }
    }

    return closurePeriods;
  }

  private buildEmptyClosurePeriod(period: Period): ClosurePeriod[] {
    const now = new Date();
    let currentMonth = now.getMonth() + 1;
    let currentYear = now.getFullYear();

    let monthsBack: number;

    switch (period) {
      case Period.TRIMESTRAL:
        monthsBack = 3;
        break;
      case Period.SEMESTRAL:
        monthsBack = 6;
        break;
      case Period.YEARLY:
        monthsBack = 12;
        break;
      default:
        throw new BadRequestException("Invalid period");
    }

    const buckets: ClosurePeriod[] = [];

    for (let i = 0; i < monthsBack; i++) {
      buckets.unshift(new ClosurePeriod(currentMonth, currentYear, null));

      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear -= 1;
      } else {
        currentMonth -= 1;
      }
    }

    return buckets;
  }
}
