import { Injectable } from "@nestjs/common";
import { Transaction as PrismaTransaction } from "generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";
import { Transaction } from "../models/transaction.model";
import { ITransactionRepository } from "./transactionRepository.interface";

@Injectable()
export class PrismaTransactionRepository
  implements
    ITransactionRepository,
    IPrismaRepository<PrismaTransaction, Transaction>
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    accountId: number;
    amount: number;
    date: Date;
    note?: string;
  }): Promise<Transaction> {
    const model = await this.prismaService.transaction.create({ data });
    return this.prismaModelToDomainModel(model);
  }

  async findById(id: number): Promise<Transaction | null> {
    const model = await this.prismaService.transaction.findUnique({
      where: { id },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Transaction | null> {
    const model = await this.prismaService.transaction.findFirst({
      where: { id, account: { userId } },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByAccountId(accountId: number): Promise<Transaction[]> {
    const models = await this.prismaService.transaction.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByUserId(userId: number): Promise<Transaction[]> {
    const models = await this.prismaService.transaction.findMany({
      where: { account: { userId } },
      orderBy: { date: "desc" },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByUserIdAndRange(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<Transaction[]> {
    const models = await this.prismaService.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async update(
    id: number,
    data: {
      amount?: number;
      date?: Date;
      note?: string | null;
      accountId?: number;
    },
  ): Promise<Transaction> {
    const model = await this.prismaService.transaction.update({
      where: { id },
      data,
    });
    return this.prismaModelToDomainModel(model);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.transaction.delete({ where: { id } });
  }

  prismaModelToDomainModel(prismaModel: PrismaTransaction): Transaction {
    return new Transaction(
      prismaModel.id,
      prismaModel.amount,
      prismaModel.date,
      prismaModel.accountId,
      prismaModel.note ?? undefined,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }
}
