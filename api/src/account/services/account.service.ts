import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ACCOUNT_REPOSITORY } from "../token";
import type { IAccountRepository } from "../repositories/accountRepository.interface";
import { Account, AccountType } from "../models/account.model";

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
    type?: AccountType;
    createdAt?: string;
  }) {
    const existingAccount = await this.accountRepository.findByUserIdAndName(
      data.userId,
      data.name,
    );

    if (existingAccount) {
      throw new ConflictException("Account already exists with this name");
    }

    const createData: {
      name: string;
      description?: string;
      userId: number;
      balance: number;
      currency: string;
      type: AccountType;
      createdAt?: Date;
    } = {
      name: data.name,
      description: data.description,
      userId: data.userId,
      balance: data.balance ?? 0,
      currency: data.currency ?? "EUR",
      type: data.type ?? "checking",
    };

    if (data.createdAt) {
      createData.createdAt = new Date(data.createdAt);
    }

    return this.accountRepository.create(createData);
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

  async updateAccount(
    id: number,
    userId: number,
    data: {
      name?: string;
      description?: string;
      type?: AccountType;
      importProviderType?: string | null;
      createdAt?: string;
    },
  ): Promise<void> {
    const account = await this.getAccount(id, userId);

    if (data.name && data.name !== account.name) {
      const existing = await this.accountRepository.findByUserIdAndName(
        userId,
        data.name,
      );
      if (existing) {
        throw new ConflictException("Account already exists with this name");
      }
    }

    const updateData: {
      name?: string;
      description?: string;
      type?: AccountType;
      importProviderType?: string | null;
      createdAt?: Date;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.importProviderType !== undefined)
      updateData.importProviderType = data.importProviderType;
    if (data.createdAt) updateData.createdAt = new Date(data.createdAt);

    await this.accountRepository.update(account.id, updateData);
  }

  async removeAccount(id: number, userId: number) {
    const account = await this.getAccount(id, userId);
    await this.accountRepository.remove(account.id);
  }
}
