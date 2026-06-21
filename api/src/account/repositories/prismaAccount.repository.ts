import { IAccountRepository } from "./accountRepository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Account, AccountType } from "../models/account.model";
import { Account as PrismaAccount } from "generated/prisma";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";

@Injectable()
export class PrismaAccountRepository
  implements IAccountRepository, IPrismaRepository<PrismaAccount, Account>
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    userId: number;
    balance: number;
    currency: string;
    type: AccountType;
    createdAt?: Date;
  }): Promise<number> {
    const model = await this.prismaService.account.create({
      data,
    });

    return model.id;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<Account | null> {
    const model = await this.prismaService.account.findFirst({
      where: { id, userId },
    });

    if (!model) {
      return null;
    }

    return this.prismaModelToDomainModel(model);
  }

  async findByUserId(userId: number): Promise<Account[]> {
    const models = await this.prismaService.account.findMany({
      where: { userId },
    });

    return models.map((model) => this.prismaModelToDomainModel(model));
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.account.delete({ where: { id } });
  }

  async findByUserIdAndName(
    userId: number,
    name: string,
  ): Promise<Account | null> {
    const model = await this.prismaService.account.findFirst({
      where: { userId, name },
    });

    if (!model) {
      return null;
    }

    return this.prismaModelToDomainModel(model);
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      type?: AccountType;
      createdAt?: Date;
    },
  ): Promise<void> {
    await this.prismaService.account.update({ where: { id }, data });
  }

  prismaModelToDomainModel(prismaModel: PrismaAccount): Account {
    return new Account(
      prismaModel.id,
      prismaModel.name,
      prismaModel.balance,
      prismaModel.currency,
      prismaModel.type as AccountType,
      prismaModel.description ?? undefined,
      prismaModel.createdAt,
    );
  }
}
