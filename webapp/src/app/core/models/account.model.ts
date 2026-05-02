export type AccountType = 'checking' | 'saving';

export interface Account {
  id: number;
  name: string;
  description?: string;
  balance?: number;
  currency?: string;
  type?: AccountType;
}
