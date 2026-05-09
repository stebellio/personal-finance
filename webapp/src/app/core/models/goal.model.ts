export interface Goal {
  id: number;
  accountId: number;
  name: string;
  target: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
