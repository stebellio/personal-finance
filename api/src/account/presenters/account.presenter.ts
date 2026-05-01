import { Account } from "../models/account.model";

export class AccountPresenter {
  id: number;
  name: string;
  description?: string;
  balance?: number;
  currency?: string;

  constructor(
    id: number,
    name: string,
    description: string,
    balance?: number,
    currency?: string,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.balance = balance;
    this.currency = currency;
  }

  static fromModel(account: Account): AccountPresenter {
    return new AccountPresenter(
      account.id,
      account.name,
      account.description ?? "",
      account.balance,
      account.currency ?? "EUR",
    );
  }
}
