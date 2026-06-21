import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AccountService } from "./services/account.service";
import { AccountPresenter } from "./presenters/account.presenter";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";
import type { AccountType } from "./models/account.model";

@Controller("accounts")
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      description?: string;
      currentBalance?: number;
      type?: AccountType;
      createdAt?: string;
    },
  ): Promise<number> {
    return this.accountService.createAccount({
      ...body,
      userId: user.id,
    });
  }

  @Get()
  async getAccounts(
    @CurrentUser() user: AuthUser,
  ): Promise<AccountPresenter[]> {
    return (await this.accountService.getAccounts(user.id)).map((account) =>
      AccountPresenter.fromModel(account),
    );
  }

  @Get("/:id")
  async getAccount(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<AccountPresenter> {
    const account = await this.accountService.getAccount(id, user.id);
    return AccountPresenter.fromModel(account);
  }

  @Patch("/:id")
  async updateAccount(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      description?: string;
      type?: AccountType;
      createdAt?: string;
    },
  ): Promise<void> {
    return this.accountService.updateAccount(id, user.id, body);
  }

  @Delete("/:id")
  async removeAccount(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    return this.accountService.removeAccount(id, user.id);
  }
}
