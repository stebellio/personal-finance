import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import {AccountService} from "./account.service";
import {AccountPresenter} from "./account.presenter";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CurrentUser} from "../auth/currentUser.decorator";
import type {AuthUser} from "../auth/authUser.model";

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Post()
    async create(
        @CurrentUser() user: AuthUser,
        @Body() body: {name: string; description?: string;}) {
        const account = await this.accountService.createAccount(
            {...body, userId: user.id}
        );
        return account.id;
    }

    @Get()
    async getAccounts(@CurrentUser() user: AuthUser) {
        return (await this.accountService.getAccounts(user.id))
            .map(
                account => new AccountPresenter(
                    account.id,
                    account.name,
                    account.description ?? ''
                )
            );
    }

    @Get('/:id')
    async getAccount(@CurrentUser() user: AuthUser,@Param('id', ParseIntPipe) id: number) {
        const account = await this.accountService.getAccount(id, user.id);
        return new AccountPresenter(
            account.id,
            account.name,
            account.description ?? ''
        );
    }

    @Delete('/:id')
    async removeAccount(@CurrentUser() user: AuthUser,@Param('id', ParseIntPipe) id: number) {
        return this.accountService.removeAccount(id, user.id);
    }
}
