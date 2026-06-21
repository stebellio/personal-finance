export interface CategoryRef {
  id: number;
  code: string;
  description: string;
}

export class Transaction {
  id: number;
  amount: number;
  date: Date;
  accountId: number;
  note?: string;
  fingerprint?: string;
  categoryId?: number;
  category?: CategoryRef;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(
    id: number,
    amount: number,
    date: Date,
    accountId: number,
    note?: string,
    fingerprint?: string,
    categoryId?: number,
    category?: CategoryRef,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.amount = amount;
    this.date = date;
    this.accountId = accountId;
    this.note = note;
    this.fingerprint = fingerprint;
    this.categoryId = categoryId;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
