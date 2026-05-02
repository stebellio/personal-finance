export class Closure {
  id: number;
  year: number;
  month: number;
  amount: number;
  accountId: number;
  note?: string;

  constructor(
    id: number,
    year: number,
    month: number,
    amount: number,
    accountId: number,
    note?: string,
  ) {
    this.id = id;
    this.year = year;
    this.month = month;
    this.amount = amount;
    this.accountId = accountId;
    this.note = note;
  }
}
