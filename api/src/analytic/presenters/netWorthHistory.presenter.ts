import { ClosurePeriod } from "../models/ClosurePeriod.model";

export class NetWorthHistoryPresenter {
  month: number;
  year: number;
  amount: number | null;
  label: string;

  constructor(
    month: number,
    year: number,
    amount: number | null,
    label: string,
  ) {
    this.month = month;
    this.year = year;
    this.amount = amount;
    this.label = label;
  }

  static fromModel(period: ClosurePeriod): NetWorthHistoryPresenter {
    return new NetWorthHistoryPresenter(
      period.month,
      period.year,
      period.amount,
      NetWorthHistoryPresenter.buildLabel(period.month, period.year),
    );
  }

  static buildLabel(month: number, year: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("it-IT", {
      month: "short",
      year: "numeric",
    });
  }
}
