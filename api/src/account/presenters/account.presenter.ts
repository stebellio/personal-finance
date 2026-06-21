import { Account, AccountType } from "../models/account.model";

export class AccountPresenter {
  id: number;
  name: string;
  description?: string;
  balance?: number;
  currency?: string;
  type: AccountType;
  createdAt: Date;

  constructor(
    id: number,
    name: string,
    description: string,
    type: AccountType,
    createdAt: Date,
    balance?: number,
    currency?: string,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.createdAt = createdAt;
    this.balance = balance;
    this.currency = currency;
  }

  static fromModel(account: Account): AccountPresenter {
    return new AccountPresenter(
      account.id,
      account.name,
      account.description ?? "",
      account.type,
      account.createdAt,
      account.balance,
      account.currency ?? "EUR",
    );
  }
}
