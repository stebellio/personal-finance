import { Closure } from "../models/closure.model";

export class ClosurePresenter {
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

  static fromModel(closure: Closure): ClosurePresenter {
    return new ClosurePresenter(
      closure.id,
      closure.year,
      closure.month,
      closure.amount,
      closure.accountId,
      closure.note,
    );
  }
}
