import { Property, PropertyType } from "../models/property.model";

export class PropertyPresenter {
  id: number;
  name: string;
  type: PropertyType;
  address?: string;
  surface?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  currentValue: number;
  currency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;

  constructor(property: Property) {
    this.id = property.id;
    this.name = property.name;
    this.type = property.type;
    this.address = property.address;
    this.surface = property.surface;
    this.purchasePrice = property.purchasePrice;
    this.purchaseDate = property.purchaseDate?.toISOString();
    this.currentValue = property.currentValue;
    this.currency = property.currency;
    this.description = property.description;
    this.createdAt = property.createdAt.toISOString();
    this.updatedAt = property.updatedAt.toISOString();
  }

  static fromModel(property: Property): PropertyPresenter {
    return new PropertyPresenter(property);
  }
}
