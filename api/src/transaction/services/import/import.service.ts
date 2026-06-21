import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import * as papa from "papaparse";
import { createHash } from "node:crypto";
import { ACCOUNT_REPOSITORY } from "../../../account/token";
import type { IAccountRepository } from "../../../account/repositories/accountRepository.interface";
import { ImportStrategy } from "./strategies/importStrategy.interface";
import { TransactionService } from "../transaction.service";
import { CategoryService } from "../category.service";
import { TRANSACTION_STRATEGIES } from "../../token";

@Injectable()
export class ImportService {
  private readonly strategyMap: Map<string, ImportStrategy>;

  constructor(
    @Inject(TRANSACTION_STRATEGIES)
    strategies: ImportStrategy[],
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly transactionService: TransactionService,
    private readonly categoryService: CategoryService,
  ) {
    this.strategyMap = new Map(strategies.map((s) => [s.providerType, s]));
  }

  async importCsv(
    fileContent: string,
    accountId: number,
    userId: number,
  ): Promise<{ imported: number; skipped: number }> {
    const account = await this.accountRepository.findByIdAndUserId(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const providerType = account.importProviderType;
    if (!providerType) {
      throw new BadRequestException(
        `Account "${account.name}" has no import provider type configured. Set it via PATCH /accounts/${accountId}`,
      );
    }

    const strategy = this.strategyMap.get(providerType);
    if (!strategy) {
      throw new BadRequestException(
        `Unknown provider type "${providerType}" for account "${account.name}". Available: ${[...this.strategyMap.keys()].join(", ")}`,
      );
    }

    const parsed = papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException(
        `CSV parsing error: ${parsed.errors[0].message}`,
      );
    }

    const normalized = strategy.parse(parsed.data);
    let imported = 0;
    let skipped = 0;

    for (const tx of normalized) {
      const fingerprint = this.computeFingerprint(
        tx.amount,
        tx.date,
        tx.description,
      );

      const existing = await this.transactionService.findByFingerprint(
        accountId,
        fingerprint,
      );
      if (existing) {
        skipped++;
        continue;
      }

      let categoryId: number | undefined;

      if (tx.categoryName) {
        categoryId = await this.resolveCategory(tx.categoryName, userId);
      }

      await this.transactionService.createTransaction({
        accountId,
        userId,
        amount: tx.amount,
        date: tx.date,
        note: tx.note,
        categoryId,
        fingerprint,
      });
      imported++;
    }

    return { imported, skipped };
  }

  private async resolveCategory(name: string, userId: number): Promise<number> {
    const existing = await this.categoryService.findByDescriptionLike(
      name,
      userId,
    );
    if (existing) {
      return existing.id;
    }

    const created = await this.categoryService.create(userId, {
      code: name.toUpperCase().replace(/\s+/g, "_").slice(0, 100),
      description: name,
    });
    return created.id;
  }

  private computeFingerprint(
    amount: number,
    date: Date,
    description: string,
  ): string {
    return createHash("sha256")
      .update(`${amount}|${date.toISOString()}|${description}`)
      .digest("hex");
  }
}
