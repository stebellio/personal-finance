import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class AccountService {

    constructor(private readonly prisma: PrismaService) {
    }

    async createAccount(data: {
        name: string;
        description?: string;
        userId: number;
    }) {
        return await this.prisma.account.create({
            data
        });
    }

    async getAccount(id: number, userId: number) {
        const account = await this.prisma.account.findFirst({where: {id, userId}});

        if (!account) {
            throw new NotFoundException();
        }

        return account;
    }

    async getAccounts(userId: number) {
        return await this.prisma.account.findMany({where: {userId}});
    }

    async removeAccount(id: number, userId: number) {
        const account = await this.getAccount(id, userId);
        await this.prisma.account.delete({where: {id: account.id}});
    }
}
