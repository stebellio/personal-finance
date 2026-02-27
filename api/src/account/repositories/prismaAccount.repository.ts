import {IAccountRepository} from "./accountRepository.interface";
import {PrismaService} from "../../prisma/prisma.service";
import {Injectable} from "@nestjs/common";
import {Account} from "../models/account.model";

@Injectable()
export class PrismaAccountRepository implements IAccountRepository{

    constructor(
        private readonly prismaService: PrismaService
    ) {
    }
    async create(data: { name: string; description?: string; userId: number }): Promise<number> {
        const model = await this.prismaService.account.create({
            data,
        });

        return model.id;
    }

    async findByIdAndUserId(id: number, userId: number): Promise<Account | null> {
        const model = await this.prismaService.account.findFirst({where: {id, userId}});

        if (!model) {
            return null;
        }

        return new Account(model.id, model.name, model.description ?? undefined)
    }

    async findByUserId(userId: number): Promise<Account[]> {
        const models = await this.prismaService.account.findMany({where: {userId}});

        return models.map(model => (
            new Account(model.id, model.name, model.description ?? undefined)
        ));
    }

    async remove(id: number): Promise<void> {
        await this.prismaService.account.delete({where: {id}});
    }
}