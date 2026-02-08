import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class ClosureService {
    constructor(private readonly prismaService: PrismaService) {
    }

    async create(data: {
        amount: number;
        date: Date;
        accountId: number;
        userId: number;
    }) {
        await this.getAccountById(data.userId, data.accountId);
        return this.prismaService.closure.create({
            data: {
                amount: data.amount,
                date: data.date,
                accountId: data.accountId,
            }
        });
    }

    private async getAccountById(userId: number, accountId: number) {
        const account = await this.prismaService.account.findFirst({
            where: {
                id: accountId,
                userId: userId,
            }
        });

        if (!account) {
            throw new NotFoundException('Account does not exist');
        }

        return account;
    }
}
