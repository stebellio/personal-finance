export type AccountType = "checking" | "saving";

export class Account {
  id: number;
  name: string;
  description?: string;
  balance: number;
  currency: string;
  type: AccountType;

  constructor(
    id: number,
    name: string,
    balance: number,
    currency: string,
    type: AccountType,
    description?: string,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.balance = balance;
    this.currency = currency;
    this.type = type;
  }
}
