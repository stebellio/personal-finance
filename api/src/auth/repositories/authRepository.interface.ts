export interface IAuthRepository {
  findByEmail(email: string): Promise<{
    id: number;
    email: string;
    password: string;
  } | null>;

  findById(id: number): Promise<{
    id: number;
    email: string;
  } | null>;

  create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<number>;
}
