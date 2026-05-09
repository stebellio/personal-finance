import { Injectable } from "@nestjs/common";
import { Goal as PrismaGoal } from "generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";
import { Goal } from "../models/goal.model";
import { IGoalRepository } from "./goalRepository.interface";

@Injectable()
export class PrismaGoalRepository
  implements IGoalRepository, IPrismaRepository<PrismaGoal, Goal>
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    accountId: number;
    name: string;
    target: number;
  }): Promise<Goal> {
    const model = await this.prismaService.goal.create({
      data: {
        accountId: data.accountId,
        name: data.name,
        targetAmount: data.target,
      },
    });
    return this.prismaModelToDomainModel(model);
  }

  async findById(id: number): Promise<Goal | null> {
    const model = await this.prismaService.goal.findUnique({ where: { id } });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<Goal | null> {
    const model = await this.prismaService.goal.findFirst({
      where: { id, account: { userId } },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByAccountId(accountId: number): Promise<Goal[]> {
    const models = await this.prismaService.goal.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByUserId(userId: number): Promise<Goal[]> {
    const models = await this.prismaService.goal.findMany({
      where: { account: { userId } },
      orderBy: { createdAt: "desc" },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByAccountIdAndName(
    accountId: number,
    name: string,
  ): Promise<Goal | null> {
    const model = await this.prismaService.goal.findFirst({
      where: { accountId, name },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async update(
    id: number,
    data: { name?: string; target?: number; completedAt?: Date | null },
  ): Promise<Goal> {
    const model = await this.prismaService.goal.update({
      where: { id },
      data: {
        name: data.name,
        targetAmount: data.target,
        completedAt: data.completedAt,
      },
    });
    return this.prismaModelToDomainModel(model);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.goal.delete({ where: { id } });
  }

  prismaModelToDomainModel(prismaModel: PrismaGoal): Goal {
    return new Goal(
      prismaModel.id,
      prismaModel.accountId,
      prismaModel.name,
      prismaModel.targetAmount,
      prismaModel.createdAt,
      prismaModel.updatedAt,
      prismaModel.completedAt,
    );
  }
}
