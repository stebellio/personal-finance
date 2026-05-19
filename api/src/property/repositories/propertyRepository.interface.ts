import {
  Property,
  PropertyCategory,
  PropertyState,
  PropertyType,
} from "../models/property.model";

export interface IPropertyRepository {
  create(data: {
    name: string;
    type: PropertyType;
    category?: PropertyCategory;
    state?: PropertyState;
    address?: string;
    surface?: number;
    cadastralSheet?: string;
    cadastralParcel?: string;
    cadastralSubaltern?: string;
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
      category?: PropertyCategory | null;
      state?: PropertyState;
      address?: string;
      surface?: number;
      cadastralSheet?: string;
      cadastralParcel?: string;
      cadastralSubaltern?: string | null;
      currentValue?: number;
      currency?: string;
      description?: string;
    },
  ): Promise<void>;

  remove(id: number): Promise<void>;
}
