import { Injectable } from "@nestjs/common";
import { Closure as PrismaClosure } from "generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";
import { Closure } from "../models/closure.model";
import { IClosureRepository } from "./closureRepository.interface";

@Injectable()
export class PrismaClosureRepository
  implements IClosureRepository, IPrismaRepository<PrismaClosure, Closure>
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    accountId: number;
    year: number;
    month: number;
    amount: number;
    note?: string;
  }): Promise<Closure> {
    const model = await this.prismaService.closure.create({ data });
    return this.prismaModelToDomainModel(model);
  }

  async findById(id: number): Promise<Closure | null> {
    const model = await this.prismaService.closure.findUnique({
      where: { id },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<Closure | null> {
    const model = await this.prismaService.closure.findFirst({
      where: { id, account: { userId } },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByAccountId(accountId: number): Promise<Closure[]> {
    const models = await this.prismaService.closure.findMany({
      where: { accountId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByUserIdAndPeriod(
    userId: number,
    year: number,
    month: number,
  ): Promise<Closure[]> {
    const models = await this.prismaService.closure.findMany({
      where: { year, month, account: { userId } },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByAccountAndPeriod(
    accountId: number,
    year: number,
    month: number,
  ): Promise<Closure | null> {
    const model = await this.prismaService.closure.findUnique({
      where: { accountId_year_month: { accountId, year, month } },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findLatestByAccountId(accountId: number): Promise<Closure | null> {
    const model = await this.prismaService.closure.findFirst({
      where: { accountId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async update(
    id: number,
    data: { amount?: number; note?: string | null },
  ): Promise<Closure> {
    const model = await this.prismaService.closure.update({
      where: { id },
      data,
    });
    return this.prismaModelToDomainModel(model);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.closure.delete({ where: { id } });
  }

  prismaModelToDomainModel(prismaModel: PrismaClosure): Closure {
    return new Closure(
      prismaModel.id,
      prismaModel.year,
      prismaModel.month,
      prismaModel.amount,
      prismaModel.accountId,
      prismaModel.note ?? undefined,
    );
  }
}
