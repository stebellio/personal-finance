import {
  Property,
  PropertyCategory,
  PropertyState,
  PropertyType,
} from "../models/property.model";

export class PropertyPresenter {
  id: number;
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
  createdAt: string;
  updatedAt: string;

  constructor(property: Property) {
    this.id = property.id;
    this.name = property.name;
    this.type = property.type;
    this.category = property.category;
    this.state = property.state;
    this.address = property.address;
    this.surface = property.surface;
    this.cadastralSheet = property.cadastralSheet;
    this.cadastralParcel = property.cadastralParcel;
    this.cadastralSubaltern = property.cadastralSubaltern;
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
