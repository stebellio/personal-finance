import { NetWorthHistoryPresenter } from "./netWorthHistory.presenter";

export class NetWorthProjectionPresenter {
  month: number;
  year: number;
  amount: number;
  label: string;

  constructor(month: number, year: number, amount: number, label: string) {
    this.month = month;
    this.year = year;
    this.amount = amount;
    this.label = label;
  }

  static fromModel(data: {
    month: number;
    year: number;
    amount: number;
  }): NetWorthProjectionPresenter {
    return new NetWorthProjectionPresenter(
      data.month,
      data.year,
      data.amount,
      NetWorthHistoryPresenter.buildLabel(data.month, data.year),
    );
  }
}
