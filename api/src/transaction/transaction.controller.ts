import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TransactionService } from "./services/transaction.service";
import { TransactionPresenter } from "./presenters/transaction.presenter";
import { ImportService } from "./services/import/import.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";

@Controller()
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly importService: ImportService,
  ) {}

  @Post("accounts/:accountId/transactions")
  async create(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
    @Body()
    body: {
      amount: number;
      date: string;
      note?: string;
      categoryId?: number;
    },
  ): Promise<TransactionPresenter> {
    const transaction = await this.transactionService.createTransaction({
      accountId,
      userId: user.id,
      amount: body.amount,
      date: new Date(body.date),
      note: body.note,
      categoryId: body.categoryId,
    });
    return TransactionPresenter.fromModel(transaction);
  }

  @Get("accounts/:accountId/transactions")
  async listByAccount(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
  ): Promise<TransactionPresenter[]> {
    const transactions = await this.transactionService.getTransactionsByAccount(
      accountId,
      user.id,
    );
    return transactions.map((t) => TransactionPresenter.fromModel(t));
  }

  @Get("transactions")
  async listAll(
    @CurrentUser() user: AuthUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ): Promise<TransactionPresenter[]> {
    const transactions =
      from && to
        ? await this.transactionService.getTransactionsByUserAndRange(
            user.id,
            new Date(from),
            new Date(to),
          )
        : await this.transactionService.getTransactionsByUser(user.id);
    return transactions.map((t) => TransactionPresenter.fromModel(t));
  }

  @Get("transactions/:id")
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TransactionPresenter> {
    const transaction = await this.transactionService.getTransaction(
      id,
      user.id,
    );
    return TransactionPresenter.fromModel(transaction);
  }

  @Patch("transactions/:id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: {
      amount?: number;
      date?: string;
      note?: string | null;
      accountId?: number;
      categoryId?: number | null;
    },
  ): Promise<TransactionPresenter> {
    const transaction = await this.transactionService.updateTransaction(
      id,
      user.id,
      {
        amount: body.amount,
        date: body.date ? new Date(body.date) : undefined,
        note: body.note,
        accountId: body.accountId,
        categoryId: body.categoryId,
      },
    );
    return TransactionPresenter.fromModel(transaction);
  }

  @Post("accounts/:accountId/transactions/import")
  @UseInterceptors(FileInterceptor("file"))
  async importCsv(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseIntPipe) accountId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    return this.importService.importCsv(
      file.buffer.toString("utf-8"),
      accountId,
      user.id,
    );
  }

  @Delete("transactions/:id")
  async remove(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.transactionService.removeTransaction(id, user.id);
  }
}
