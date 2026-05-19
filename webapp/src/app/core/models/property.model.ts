export type PropertyType = 'building' | 'land';

export type PropertyCategory =
  | 'apartment'
  | 'garage'
  | 'office'
  | 'commercial'
  | 'villa'
  | 'rural_house'
  | 'storage';

export type PropertyState = 'free' | 'family_use' | 'rented';

export interface Property {
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
  currency?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertySummary {
  total: number;
  count: number;
  byType: { type: PropertyType; total: number; count: number }[];
}
