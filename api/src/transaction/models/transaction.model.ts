export class Transaction {
  id: number;
  amount: number;
  date: Date;
  accountId: number;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(
    id: number,
    amount: number,
    date: Date,
    accountId: number,
    note?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.amount = amount;
    this.date = date;
    this.accountId = accountId;
    this.note = note;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
