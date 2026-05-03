import { Closure } from "../models/closure.model";

export interface IClosureRepository {
  create(data: {
    accountId: number;
    year: number;
    month: number;
    amount: number;
    note?: string;
  }): Promise<Closure>;

  findById(id: number): Promise<Closure | null>;

  findByIdAndUserId(id: number, userId: number): Promise<Closure | null>;

  findByAccountId(accountId: number): Promise<Closure[]>;

  findByUserIdAndRange(
    userId: number,
    start: { year: number; month: number },
    end: { year: number; month: number },
  ): Promise<Closure[]>;

  findByUserIdAndPeriod(
    userId: number,
    year: number,
    month: number,
  ): Promise<Closure[]>;

  findByAccountAndPeriod(
    accountId: number,
    year: number,
    month: number,
  ): Promise<Closure | null>;

  findLatestByAccountId(accountId: number): Promise<Closure | null>;

  update(
    id: number,
    data: { amount?: number; note?: string | null },
  ): Promise<Closure>;

  remove(id: number): Promise<void>;
}
