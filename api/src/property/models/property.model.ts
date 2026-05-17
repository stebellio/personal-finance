export type PropertyType = "building" | "land";

export class Property {
  id: number;
  name: string;
  type: PropertyType;
  address?: string;
  surface?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  currentValue: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;

  constructor(
    id: number,
    name: string,
    type: PropertyType,
    currentValue: number,
    currency: string,
    createdAt: Date,
    updatedAt: Date,
    userId: number,
    address?: string,
    surface?: number,
    purchasePrice?: number,
    purchaseDate?: Date,
    description?: string,
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.currentValue = currentValue;
    this.currency = currency;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.userId = userId;
    this.address = address;
    this.surface = surface;
    this.purchasePrice = purchasePrice;
    this.purchaseDate = purchaseDate;
    this.description = description;
  }
}
