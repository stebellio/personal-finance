export type AccountType = 'checking' | 'saving' | 'debit';

export interface Account {
  id: number;
  name: string;
  description?: string;
  balance?: number;
  currency?: string;
  type?: AccountType;
}
