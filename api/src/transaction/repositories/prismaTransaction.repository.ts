import { Injectable } from "@nestjs/common";
import { Transaction as PrismaTransaction } from "generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";
import { Transaction } from "../models/transaction.model";
import { ITransactionRepository } from "./transactionRepository.interface";

const transactionInclude = {
  category: { select: { id: true, code: true, description: true } },
};

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
    categoryId?: number;
    fingerprint?: string;
  }): Promise<Transaction> {
    const model = await this.prismaService.transaction.create({
      data,
      include: transactionInclude,
    });
    return this.prismaModelToDomainModel(model);
  }

  async findById(id: number): Promise<Transaction | null> {
    const model = await this.prismaService.transaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Transaction | null> {
    const model = await this.prismaService.transaction.findFirst({
      where: { id, account: { userId } },
      include: transactionInclude,
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByAccountId(accountId: number): Promise<Transaction[]> {
    const models = await this.prismaService.transaction.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
      include: transactionInclude,
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByAccountIdAndFingerprint(
    accountId: number,
    fingerprint: string,
  ): Promise<Transaction | null> {
    const model = await this.prismaService.transaction.findFirst({
      where: { accountId, fingerprint },
    });
    return model ? this.prismaModelToDomainModel(model) : null;
  }

  async findByUserId(userId: number): Promise<Transaction[]> {
    const models = await this.prismaService.transaction.findMany({
      where: { account: { userId } },
      orderBy: { date: "desc" },
      include: transactionInclude,
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
      include: transactionInclude,
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
      categoryId?: number | null;
    },
  ): Promise<Transaction> {
    const model = await this.prismaService.transaction.update({
      where: { id },
      data,
      include: transactionInclude,
    });
    return this.prismaModelToDomainModel(model);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.transaction.delete({ where: { id } });
  }

  prismaModelToDomainModel(prismaModel: PrismaTransaction): Transaction {
    const model = prismaModel as PrismaTransaction & {
      category?: { id: number; code: string; description: string } | null;
    };
    return new Transaction(
      model.id,
      model.amount,
      model.date,
      model.accountId,
      model.note ?? undefined,
      model.fingerprint ?? undefined,
      model.categoryId ?? undefined,
      model.category ?? undefined,
      model.createdAt,
      model.updatedAt,
    );
  }
}
