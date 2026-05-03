export class ClosurePeriod {
  month: number;
  year: number;
  amount: number | null;

  constructor(month: number, year: number, amount: number | null) {
    this.month = month;
    this.year = year;
    this.amount = amount;
  }
}
