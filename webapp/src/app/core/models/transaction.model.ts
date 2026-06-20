export interface Transaction {
  id: number;
  amount: number;
  date: string;
  accountId: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
