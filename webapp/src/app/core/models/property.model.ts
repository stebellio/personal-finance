export type PropertyType = 'building' | 'land';

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  address?: string;
  surface?: number;
  purchasePrice?: number;
  purchaseDate?: string;
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
