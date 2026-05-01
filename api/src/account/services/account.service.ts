import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ACCOUNT_REPOSITORY } from "../token";
import type { IAccountRepository } from "../repositories/accountRepository.interface";
import { Account } from "../models/account.model";

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async createAccount(data: {
    name: string;
    description?: string;
    userId: number;
    balance?: number;
    currency?: string;
  }) {
    return this.accountRepository.create({
      name: data.name,
      description: data.description,
      userId: data.userId,
      balance: data.balance ?? 0,
      currency: data.currency ?? "EUR",
    });
  }

  async getAccount(id: number, userId: number): Promise<Account> {
    const account = await this.accountRepository.findByIdAndUserId(id, userId);

    if (!account) {
      throw new NotFoundException();
    }

    return account;
  }

  async getAccounts(userId: number): Promise<Account[]> {
    return this.accountRepository.findByUserId(userId);
  }

  async removeAccount(id: number, userId: number) {
    const account = await this.getAccount(id, userId);
    await this.accountRepository.remove(account.id);
  }
}
