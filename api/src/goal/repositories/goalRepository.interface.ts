import { Goal } from "../models/goal.model";

export interface IGoalRepository {
  create(data: {
    accountId: number;
    name: string;
    target: number;
  }): Promise<Goal>;

  findById(id: number): Promise<Goal | null>;

  findByIdAndUserId(id: number, userId: number): Promise<Goal | null>;

  findByAccountId(accountId: number): Promise<Goal[]>;

  findByUserId(userId: number): Promise<Goal[]>;

  findByAccountIdAndName(accountId: number, name: string): Promise<Goal | null>;

  update(
    id: number,
    data: { name?: string; target?: number; completedAt?: Date | null },
  ): Promise<Goal>;

  remove(id: number): Promise<void>;
}
