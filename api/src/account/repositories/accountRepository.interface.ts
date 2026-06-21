import { Account, AccountType } from "../models/account.model";

export interface IAccountRepository {
  create(data: {
    name: string;
    description?: string;
    userId: number;
    balance: number;
    currency: string;
    type: AccountType;
    createdAt?: Date;
  }): Promise<number>;

  findByIdAndUserId(id: number, userId: number): Promise<Account | null>;

  findByUserId(userId: number): Promise<Account[]>;

  remove(id: number): Promise<void>;

  findByUserIdAndName(userId: number, name: string): Promise<Account | null>;

  update(
    id: number,
    data: {
      name?: string;
      description?: string;
      type?: AccountType;
      createdAt?: Date;
    },
  ): Promise<void>;
}
