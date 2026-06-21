import { Transaction, CategoryRef } from "../models/transaction.model";

export class TransactionPresenter {
  id: number;
  amount: number;
  date: string;
  accountId: number;
  note?: string;
  categoryId?: number;
  category?: CategoryRef;
  createdAt?: string;
  updatedAt?: string;

  constructor(
    id: number,
    amount: number,
    date: Date,
    accountId: number,
    note?: string,
    categoryId?: number,
    category?: CategoryRef,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.amount = amount;
    this.date = date.toISOString();
    this.accountId = accountId;
    this.note = note;
    this.categoryId = categoryId;
    this.category = category;
    this.createdAt = createdAt?.toISOString();
    this.updatedAt = updatedAt?.toISOString();
  }

  static fromModel(transaction: Transaction): TransactionPresenter {
    return new TransactionPresenter(
      transaction.id,
      transaction.amount,
      transaction.date,
      transaction.accountId,
      transaction.note,
      transaction.categoryId,
      transaction.category,
      transaction.createdAt,
      transaction.updatedAt,
    );
  }
}
