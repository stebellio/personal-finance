import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PROPERTY_REPOSITORY } from "../token";
import type { IPropertyRepository } from "../repositories/propertyRepository.interface";
import { Property, PropertyType } from "../models/property.model";

export interface PropertySummary {
  total: number;
  count: number;
  byType: { type: PropertyType; total: number; count: number }[];
}

@Injectable()
export class PropertyService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async createProperty(data: {
    name: string;
    type?: PropertyType;
    address?: string;
    surface?: number;
    purchasePrice?: number;
    purchaseDate?: Date;
    currentValue?: number;
    currency?: string;
    description?: string;
    userId: number;
  }): Promise<number> {
    const existing = await this.propertyRepository.findByUserIdAndName(
      data.userId,
      data.name,
    );
    if (existing) {
      throw new ConflictException("Property already exists with this name");
    }
    return this.propertyRepository.create({
      name: data.name,
      type: data.type ?? "building",
      address: data.address,
      surface: data.surface,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate,
      currentValue: data.currentValue ?? 0,
      currency: data.currency ?? "EUR",
      description: data.description,
      userId: data.userId,
    });
  }

  async getProperty(id: number, userId: number): Promise<Property> {
    const property = await this.propertyRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!property) throw new NotFoundException();
    return property;
  }

  async getProperties(userId: number): Promise<Property[]> {
    return this.propertyRepository.findByUserId(userId);
  }

  async getSummary(userId: number): Promise<PropertySummary> {
    const properties = await this.propertyRepository.findByUserId(userId);
    const byTypeMap = new Map<PropertyType, { total: number; count: number }>();

    for (const p of properties) {
      const entry = byTypeMap.get(p.type) ?? { total: 0, count: 0 };
      entry.total += p.currentValue;
      entry.count += 1;
      byTypeMap.set(p.type, entry);
    }

    return {
      total: properties.reduce((sum, p) => sum + p.currentValue, 0),
      count: properties.length,
      byType: Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
    };
  }

  async updateProperty(
    id: number,
    userId: number,
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
    const property = await this.getProperty(id, userId);

    if (data.name && data.name !== property.name) {
      const existing = await this.propertyRepository.findByUserIdAndName(
        userId,
        data.name,
      );
      if (existing) {
        throw new ConflictException("Property already exists with this name");
      }
    }

    await this.propertyRepository.update(id, data);
  }

  async removeProperty(id: number, userId: number): Promise<void> {
    const property = await this.getProperty(id, userId);
    await this.propertyRepository.remove(property.id);
  }
}
