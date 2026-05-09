import { Goal } from "../models/goal.model";

export class GoalPresenter {
  id: number;
  accountId: number;
  name: string;
  target: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;

  constructor(
    id: number,
    accountId: number,
    name: string,
    target: number,
    createdAt: Date,
    updatedAt: Date,
    completedAt: Date | null,
  ) {
    this.id = id;
    this.accountId = accountId;
    this.name = name;
    this.target = target;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = completedAt;
  }

  static fromModel(goal: Goal): GoalPresenter {
    return new GoalPresenter(
      goal.id,
      goal.accountId,
      goal.name,
      goal.target,
      goal.createdAt,
      goal.updatedAt,
      goal.completedAt,
    );
  }
}
