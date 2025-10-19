import {Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import {AccountService} from "./account.service";
import {AccountPresenter} from "./account.presenter";
import {AuthGuard} from "../auth/auth.guard";

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
    private readonly userId = 4; //TODO Change
    constructor(private readonly accountService: AccountService) {}

    @Post()
    async create(@Body() body: {name: string; description?: string;}) {
        const account = await this.accountService.createAccount(
            {...body, userId: this.userId}
        );
        return account.id;
    }

    @Get()
    async getAccounts() {
        return (await this.accountService.getAccounts(this.userId))
            .map(
                account => new AccountPresenter(
                    account.id,
                    account.name,
                    account.description ?? ''
                )
            );
    }

    @Get('/:id')
    async getAccount(@Param('id', ParseIntPipe) id: number) {
        const account = await this.accountService.getAccount(id, this.userId);
        return new AccountPresenter(
            account.id,
            account.name,
            account.description ?? ''
        );
    }
}
