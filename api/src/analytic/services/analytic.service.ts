import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

  async getNetWorthProjection(
    userId: number,
  ): Promise<{ month: number; year: number; amount: number }> {
    const closurePeriods = this.buildEmptyClosurePeriod(Period.YEARLY);
    const firstPeriod = closurePeriods[0];
    const lastPeriod = closurePeriods[closurePeriods.length - 1];

    const closures = await this.closureRepository.findByUserIdAndRange(
      userId,
      { year: firstPeriod.year, month: firstPeriod.month },
      { year: lastPeriod.year, month: lastPeriod.month },
    );

    const periodMap = new Map(
      closurePeriods.map((cp) => [`${cp.year}-${cp.month}`, cp]),
    );

    for (const closure of closures) {
      const cp = periodMap.get(`${closure.year}-${closure.month}`);
      if (cp) {
        cp.amount = (cp.amount ?? 0) + closure.amount;
      }
    }

    const validPoints = closurePeriods
      .map((cp, idx) => ({ idx, amount: cp.amount }))
      .filter((p): p is { idx: number; amount: number } => p.amount !== null)
      .map((p) => ({ x: p.idx, y: p.amount }));

    if (validPoints.length < 2) {
      throw new NotFoundException("Not enough data for projection");
    }

    const { slope, intercept } = this.linearRegression(validPoints);
    const projectedAmount = slope * closurePeriods.length + intercept;

    const nextMonth =
      lastPeriod.month === 12
        ? { year: lastPeriod.year + 1, month: 1 }
        : { year: lastPeriod.year, month: lastPeriod.month + 1 };

    return { ...nextMonth, amount: projectedAmount };
  }

  private linearRegression(points: { x: number; y: number }[]): {
    slope: number;
    intercept: number;
  } {
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n };
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  private buildEmptyClosurePeriod(period: Period): ClosurePeriod[] {
    const now = new Date();
    let currentMonth = now.getMonth();
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
