import { Transaction } from "../models/transaction.model";

export interface ITransactionRepository {
  create(data: {
    accountId: number;
    amount: number;
    date: Date;
    note?: string;
    categoryId?: number;
    fingerprint?: string;
  }): Promise<Transaction>;

  findById(id: number): Promise<Transaction | null>;

  findByIdAndUserId(id: number, userId: number): Promise<Transaction | null>;

  findByAccountId(accountId: number): Promise<Transaction[]>;

  findByAccountIdAndFingerprint(
    accountId: number,
    fingerprint: string,
  ): Promise<Transaction | null>;

  findByUserId(userId: number): Promise<Transaction[]>;

  findByUserIdAndRange(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<Transaction[]>;

  update(
    id: number,
    data: {
      amount?: number;
      date?: Date;
      note?: string | null;
      accountId?: number;
      categoryId?: number | null;
    },
  ): Promise<Transaction>;

  remove(id: number): Promise<void>;
}
