import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { IGoalRepository } from "../repositories/goalRepository.interface";
import { GOAL_REPOSITORY } from "../token";
import { ACCOUNT_REPOSITORY } from "../../account/token";
import type { IAccountRepository } from "../../account/repositories/accountRepository.interface";
import { Goal } from "../models/goal.model";

@Injectable()
export class GoalService {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async createGoal(data: {
    accountId: number;
    userId: number;
    name: string;
    target: number;
  }): Promise<Goal> {
    this.validateTarget(data.target);

    const account = await this.accountRepository.findByIdAndUserId(
      data.accountId,
      data.userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const existing = await this.goalRepository.findByAccountIdAndName(
      data.accountId,
      data.name,
    );
    if (existing) {
      throw new ConflictException("Goal already exists with this name");
    }

    return this.goalRepository.create({
      accountId: data.accountId,
      name: data.name,
      target: data.target,
    });
  }

  async getGoal(id: number, userId: number): Promise<Goal> {
    const goal = await this.goalRepository.findByIdAndUserId(id, userId);
    if (!goal) {
      throw new NotFoundException();
    }
    return goal;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return this.goalRepository.findByUserId(userId);
  }

  async getGoalsByAccount(accountId: number, userId: number): Promise<Goal[]> {
    const account = await this.accountRepository.findByIdAndUserId(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }
    return this.goalRepository.findByAccountId(accountId);
  }

  async updateGoal(
    id: number,
    userId: number,
    data: { name?: string; target?: number; completedAt?: Date | null },
  ): Promise<Goal> {
    const goal = await this.getGoal(id, userId);

    if (data.target !== undefined) {
      this.validateTarget(data.target);
    }

    if (data.name && data.name !== goal.name) {
      const existing = await this.goalRepository.findByAccountIdAndName(
        goal.accountId,
        data.name,
      );
      if (existing) {
        throw new ConflictException("Goal already exists with this name");
      }
    }

    return this.goalRepository.update(id, data);
  }

  async removeGoal(id: number, userId: number): Promise<void> {
    const goal = await this.getGoal(id, userId);
    await this.goalRepository.remove(goal.id);
  }

  private validateTarget(target: number): void {
    if (!Number.isFinite(target) || target <= 0) {
      throw new BadRequestException("Target must be a positive number");
    }
  }
}
