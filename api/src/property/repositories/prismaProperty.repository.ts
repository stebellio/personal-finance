import { IPropertyRepository } from "./propertyRepository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Property, PropertyType } from "../models/property.model";
import { Property as PrismaProperty } from "generated/prisma";
import { IPrismaRepository } from "../../prisma/prismaRepository.interface";

@Injectable()
export class PrismaPropertyRepository
  implements IPropertyRepository, IPrismaRepository<PrismaProperty, Property>
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    name: string;
    type: PropertyType;
    address?: string;
    surface?: number;
    purchasePrice?: number;
    purchaseDate?: Date;
    currentValue: number;
    currency: string;
    description?: string;
    userId: number;
  }): Promise<number> {
    const model = await this.prismaService.property.create({ data });
    return model.id;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Property | null> {
    const model = await this.prismaService.property.findFirst({
      where: { id, userId },
    });
    if (!model) return null;
    return this.prismaModelToDomainModel(model);
  }

  async findByUserId(userId: number): Promise<Property[]> {
    const models = await this.prismaService.property.findMany({
      where: { userId },
    });
    return models.map((m) => this.prismaModelToDomainModel(m));
  }

  async findByUserIdAndName(
    userId: number,
    name: string,
  ): Promise<Property | null> {
    const model = await this.prismaService.property.findFirst({
      where: { userId, name },
    });
    if (!model) return null;
    return this.prismaModelToDomainModel(model);
  }

  async update(
    id: number,
    data: {
      name?: string;
      type?: PropertyType;
      address?: string;
      surface?: number;
      purchasePrice?: number;
      purchaseDate?: Date;
      currentValue?: number;
      currency?: string;
      description?: string;
    },
  ): Promise<void> {
    await this.prismaService.property.update({ where: { id }, data });
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.property.delete({ where: { id } });
  }

  prismaModelToDomainModel(prismaModel: PrismaProperty): Property {
    return new Property(
      prismaModel.id,
      prismaModel.name,
      prismaModel.type as PropertyType,
      prismaModel.currentValue,
      prismaModel.currency,
      prismaModel.createdAt,
      prismaModel.updatedAt,
      prismaModel.userId,
      prismaModel.address ?? undefined,
      prismaModel.surface ?? undefined,
      prismaModel.purchasePrice ?? undefined,
      prismaModel.purchaseDate ?? undefined,
      prismaModel.description ?? undefined,
    );
  }
}
