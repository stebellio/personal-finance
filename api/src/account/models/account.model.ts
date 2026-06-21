export type AccountType = "checking" | "saving" | "debit" | "investment";

export class Account {
  id: number;
  name: string;
  description?: string;
  balance: number;
  currency: string;
  type: AccountType;
  createdAt: Date;

  constructor(
    id: number,
    name: string,
    balance: number,
    currency: string,
    type: AccountType,
    description?: string,
    createdAt?: Date,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.balance = balance;
    this.currency = currency;
    this.type = type;
    this.createdAt = createdAt ?? new Date();
  }
}
