import { Transaction } from "../models/transaction.model";

export interface ITransactionRepository {
  create(data: {
    accountId: number;
    amount: number;
    date: Date;
    note?: string;
  }): Promise<Transaction>;

  findById(id: number): Promise<Transaction | null>;

  findByIdAndUserId(id: number, userId: number): Promise<Transaction | null>;

  findByAccountId(accountId: number): Promise<Transaction[]>;

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
    },
  ): Promise<Transaction>;

  remove(id: number): Promise<void>;
}
