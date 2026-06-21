import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { TRANSACTION_REPOSITORY } from "../../transaction/token";
import type { ITransactionRepository } from "../../transaction/repositories/transactionRepository.interface";
import { ACCOUNT_REPOSITORY } from "../../account/token";
import type { IAccountRepository } from "../../account/repositories/accountRepository.interface";
import { Transaction } from "../../transaction/models/transaction.model";
import { ClosurePeriod } from "../models/ClosurePeriod.model";
import { Period } from "../enum/period.enum";

@Injectable()
export class AnalyticService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async getNetWorthHistory(
    userId: number,
    period: Period,
  ): Promise<ClosurePeriod[]> {
    const buckets = this.buildEmptyClosurePeriod(period);
    const firstBucket = buckets[0];
    const lastBucket = buckets[buckets.length - 1];

    const startDate = new Date(firstBucket.year, firstBucket.month, 1);
    const endDate = new Date(
      lastBucket.year,
      lastBucket.month + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const accounts = await this.accountRepository.findByUserId(userId);

    if (!accounts.length) {
      return buckets;
    }

    const transactions = await this.transactionRepository.findByUserIdAndRange(
      userId,
      startDate,
      endDate,
    );

    const txByAccount = this.groupTransactionsByAccount(transactions);

    for (const bucket of buckets) {
      const bucketEnd = new Date(
        bucket.year,
        bucket.month + 1,
        0,
        23,
        59,
        59,
        999,
      );
      let netWorth = 0;

      for (const account of accounts) {
        if (account.createdAt > bucketEnd) continue;

        const accountTxs = txByAccount.get(account.id) ?? [];
        let sumAfter = 0;
        for (const tx of accountTxs) {
          if (tx.date > bucketEnd) {
            sumAfter += tx.amount;
          }
        }

        const balanceAtEnd = account.balance - sumAfter;
        netWorth += account.type === "debit" ? -balanceAtEnd : balanceAtEnd;
      }

      bucket.amount = netWorth;
    }

    return buckets;
  }

  async getNetWorthProjection(
    userId: number,
  ): Promise<{ month: number; year: number; amount: number }> {
    const periods = await this.getNetWorthHistory(userId, Period.YEARLY);

    if (!periods || periods.length < 1) {
      throw new UnprocessableEntityException("Invalid period.");
    }

    const first = periods[0];
    const last = periods[periods.length - 1];
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const avgAmount =
      ((last.amount ?? 0) - (first.amount ?? 0)) / periods.length;
    const predictedAmount = (last.amount ?? 0) + avgAmount;

    return {
      month: nextMonthDate.getMonth(),
      year: nextMonthDate.getFullYear(),
      amount: predictedAmount,
    };
  }

  private groupTransactionsByAccount(
    transactions: Transaction[],
  ): Map<number, Transaction[]> {
    const map = new Map<number, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.accountId);
      if (list) {
        list.push(tx);
      } else {
        map.set(tx.accountId, [tx]);
      }
    }
    return map;
  }

  async getExpensesByCategory(
    userId: number,
    period: Period,
  ): Promise<
    { categoryCode: string; categoryDescription: string; total: number }[]
  > {
    const { startDate, endDate } = this.getDateRange(period);

    const transactions = await this.transactionRepository.findByUserIdAndRange(
      userId,
      startDate,
      endDate,
    );

    const expenses = transactions.filter((tx) => tx.amount < 0);

    const grouped = new Map<
      string,
      { categoryCode: string; categoryDescription: string; total: number }
    >();

    for (const tx of expenses) {
      const code = tx.category?.code ?? "__uncategorized__";
      const desc = tx.category?.description ?? "Non categorizzato";
      const existing = grouped.get(code);
      if (existing) {
        existing.total += Math.abs(tx.amount);
      } else {
        grouped.set(code, {
          categoryCode: code,
          categoryDescription: desc,
          total: Math.abs(tx.amount),
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }

  private getMonthsBack(period: Period): number {
    switch (period) {
      case Period.TRIMESTRAL:
        return 3;
      case Period.SEMESTRAL:
        return 6;
      case Period.YEARLY:
        return 12;
      default:
        throw new BadRequestException("Invalid period");
    }
  }

  private getDateRange(period: Period): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    const monthsBack = this.getMonthsBack(period);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - monthsBack + 1, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  private buildEmptyClosurePeriod(period: Period): ClosurePeriod[] {
    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();
    const monthsBack = this.getMonthsBack(period);

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
