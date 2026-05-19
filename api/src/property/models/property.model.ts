export type PropertyType = "building" | "land";

export type PropertyCategory =
  | "apartment"
  | "garage"
  | "office"
  | "commercial"
  | "villa"
  | "rural_house"
  | "storage";

export type PropertyState = "free" | "family_use" | "rented";

export class Property {
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
    description?: string,
    category?: PropertyCategory,
    state?: PropertyState,
    cadastralSheet?: string,
    cadastralParcel?: string,
    cadastralSubaltern?: string,
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
    this.description = description;
    this.category = category;
    this.state = state;
    this.cadastralSheet = cadastralSheet;
    this.cadastralParcel = cadastralParcel;
    this.cadastralSubaltern = cadastralSubaltern;
  }
}
