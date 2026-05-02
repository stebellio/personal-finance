import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ACCOUNT_REPOSITORY } from "../../account/token";
import type { IAccountRepository } from "../../account/repositories/accountRepository.interface";
import { CLOSURE_REPOSITORY } from "../token";
import type { IClosureRepository } from "../repositories/closureRepository.interface";
import { Closure } from "../models/closure.model";

@Injectable()
export class ClosureService {
  constructor(
    @Inject(CLOSURE_REPOSITORY)
    private readonly closureRepository: IClosureRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async createClosure(data: {
    accountId: number;
    userId: number;
    year: number;
    month: number;
    amount: number;
    note?: string;
  }): Promise<Closure> {
    this.validatePeriod(data.year, data.month);

    const account = await this.accountRepository.findByIdAndUserId(
      data.accountId,
      data.userId,
    );

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const existing = await this.closureRepository.findByAccountAndPeriod(
      data.accountId,
      data.year,
      data.month,
    );

    if (existing) {
      throw new ConflictException(
        "Closure already exists for this account and period",
      );
    }

    const closure = await this.closureRepository.create({
      accountId: data.accountId,
      year: data.year,
      month: data.month,
      amount: data.amount,
      note: data.note,
    });

    const latest = await this.closureRepository.findLatestByAccountId(
      data.accountId,
    );
    if (latest && latest.id === closure.id) {
      await this.accountRepository.updateBalance(
        data.accountId,
        closure.amount,
      );
    }

    return closure;
  }

  async getClosure(id: number, userId: number): Promise<Closure> {
    const closure = await this.closureRepository.findByIdAndUserId(id, userId);
    if (!closure) {
      throw new NotFoundException();
    }
    return closure;
  }

  async getClosuresByAccount(
    accountId: number,
    userId: number,
  ): Promise<Closure[]> {
    const account = await this.accountRepository.findByIdAndUserId(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }
    return this.closureRepository.findByAccountId(accountId);
  }

  async getClosuresByPeriod(
    userId: number,
    year: number,
    month: number,
  ): Promise<Closure[]> {
    this.validatePeriod(year, month);
    return this.closureRepository.findByUserIdAndPeriod(userId, year, month);
  }

  async updateClosure(
    id: number,
    userId: number,
    data: { amount?: number; note?: string | null },
  ): Promise<Closure> {
    const closure = await this.closureRepository.findByIdAndUserId(id, userId);
    if (!closure) {
      throw new NotFoundException();
    }

    const updated = await this.closureRepository.update(id, data);

    if (data.amount !== undefined) {
      const latest = await this.closureRepository.findLatestByAccountId(
        updated.accountId,
      );
      if (latest && latest.id === updated.id) {
        await this.accountRepository.updateBalance(
          updated.accountId,
          updated.amount,
        );
      }
    }

    return updated;
  }

  async removeClosure(id: number, userId: number): Promise<void> {
    const closure = await this.closureRepository.findByIdAndUserId(id, userId);
    if (!closure) {
      throw new NotFoundException();
    }

    const latest = await this.closureRepository.findLatestByAccountId(
      closure.accountId,
    );
    const wasLatest = latest?.id === closure.id;

    await this.closureRepository.remove(id);

    if (wasLatest) {
      const newLatest = await this.closureRepository.findLatestByAccountId(
        closure.accountId,
      );
      if (newLatest) {
        await this.accountRepository.updateBalance(
          closure.accountId,
          newLatest.amount,
        );
      }
    }
  }

  private validatePeriod(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new BadRequestException("Invalid year");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException("Invalid month");
    }
  }
}
