export interface IAccountRepository {
    create(data: {
        name: string;
        description?: string;
        userId: number;
    }): Promise<number>;

    findByIdAndUserId(id: number, userId: number): Promise<{
        id: number;
        name: string;
        description?: string;
    } | null>;

    findByUserId(userId: number): Promise<{
        id: number;
        name: string;
        description?: string
    }[]>;

    remove(id: number): Promise<void>;
}