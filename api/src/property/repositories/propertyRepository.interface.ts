import { Property, PropertyType } from "../models/property.model";

export interface IPropertyRepository {
  create(data: {
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
  }): Promise<number>;

  findByIdAndUserId(id: number, userId: number): Promise<Property | null>;

  findByUserId(userId: number): Promise<Property[]>;

  findByUserIdAndName(userId: number, name: string): Promise<Property | null>;

  update(
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
  ): Promise<void>;

  remove(id: number): Promise<void>;
}
