import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ACCOUNT_REPOSITORY } from "../../account/token";
import type { IAccountRepository } from "../../account/repositories/accountRepository.interface";
import { TRANSACTION_REPOSITORY } from "../token";
import type { ITransactionRepository } from "../repositories/transactionRepository.interface";
import { Transaction } from "../models/transaction.model";

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async createTransaction(data: {
    accountId: number;
    userId: number;
    amount: number;
    date: Date;
    note?: string;
  }): Promise<Transaction> {
    const account = await this.accountRepository.findByIdAndUserId(
      data.accountId,
      data.userId,
    );

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const transaction = await this.transactionRepository.create({
      accountId: data.accountId,
      amount: data.amount,
      date: data.date,
      note: data.note,
    });

    await this.accountRepository.updateBalance(
      data.accountId,
      account.balance + data.amount,
    );

    return transaction;
  }

  async getTransaction(id: number, userId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }

  async getTransactionsByAccount(
    accountId: number,
    userId: number,
  ): Promise<Transaction[]> {
    const account = await this.accountRepository.findByIdAndUserId(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }
    return this.transactionRepository.findByAccountId(accountId);
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId);
  }

  async getTransactionsByUserAndRange(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<Transaction[]> {
    return this.transactionRepository.findByUserIdAndRange(userId, start, end);
  }

  async updateTransaction(
    id: number,
    userId: number,
    data: {
      amount?: number;
      date?: Date;
      note?: string | null;
      accountId?: number;
    },
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    const oldAmount = transaction.amount;
    const oldAccountId = transaction.accountId;
    const newAccountId =
      data.accountId !== undefined ? data.accountId : oldAccountId;
    const newAmount = data.amount !== undefined ? data.amount : oldAmount;

    if (newAccountId !== oldAccountId) {
      const oldAccount = await this.accountRepository.findByIdAndUserId(
        oldAccountId,
        userId,
      );
      if (!oldAccount) {
        throw new NotFoundException("Old account not found");
      }
      const newAccount = await this.accountRepository.findByIdAndUserId(
        newAccountId,
        userId,
      );
      if (!newAccount) {
        throw new NotFoundException("New account not found");
      }

      await this.accountRepository.updateBalance(
        oldAccountId,
        oldAccount.balance - oldAmount,
      );
      await this.accountRepository.updateBalance(
        newAccountId,
        newAccount.balance + newAmount,
      );
    } else if (data.amount !== undefined && data.amount !== oldAmount) {
      const account = await this.accountRepository.findByIdAndUserId(
        oldAccountId,
        userId,
      );
      if (!account) {
        throw new NotFoundException("Account not found");
      }
      await this.accountRepository.updateBalance(
        oldAccountId,
        account.balance - oldAmount + newAmount,
      );
    }

    return this.transactionRepository.update(id, data);
  }

  async removeTransaction(id: number, userId: number): Promise<void> {
    const transaction = await this.transactionRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    const account = await this.accountRepository.findByIdAndUserId(
      transaction.accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }

    await this.accountRepository.updateBalance(
      transaction.accountId,
      account.balance - transaction.amount,
    );
    await this.transactionRepository.remove(id);
  }
}
