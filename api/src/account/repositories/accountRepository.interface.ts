export interface IAccountRepository {
  create(data: {
    name: string;
    description?: string;
    userId: number;
    balance: number;
    currency: string;
  }): Promise<number>;

  findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<{
    id: number;
    name: string;
    description?: string;
    balance: number;
    currency: string;
  } | null>;

  findByUserId(userId: number): Promise<
    {
      id: number;
      name: string;
      description?: string;
      balance: number;
      currency: string;
    }[]
  >;

  remove(id: number): Promise<void>;
}
