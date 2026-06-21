export interface Category {
  id: number;
  code: string;
  description: string;
}

export interface Transaction {
  id: number;
  amount: number;
  date: string;
  accountId: number;
  note?: string;
  categoryId?: number;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}
