import { ImportService } from "../../../src/transaction/services/import/import.service";
import { Account } from "../../../src/account/models/account.model";
import { NormalizedTransaction } from "../../../src/transaction/services/import/models/normalized-transaction.model";
import { Transaction } from "../../../src/transaction/models/transaction.model";
import type { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import type { ImportStrategy } from "../../../src/transaction/services/import/strategies/importStrategy.interface";
import type { TransactionService } from "../../../src/transaction/services/transaction.service";
import type { CategoryService } from "../../../src/transaction/services/category.service";
import { mock } from "jest-mock-extended";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import Mocked = jest.Mocked;

const userFixture = { id: 1 };
const accountId = 100;

const mockAccount = new Account(
  accountId,
  "Test Account",
  1000,
  "EUR",
  "checking",
  undefined,
  undefined,
  "test-provider",
);

const csvFixture = `Header1,Header2,Header3\nval1,val2,val3\nval4,val5,val6`;

const normalizedTx1 = new NormalizedTransaction(
  new Date("2026-01-15"),
  "Grocery shopping",
  -50,
  undefined,
  "some notes",
);

const normalizedTx2 = new NormalizedTransaction(
  new Date("2026-01-16"),
  "Coffee",
  -5,
);

const normalizedTxWithCategory = new NormalizedTransaction(
  new Date("2026-01-17"),
  "Fuel",
  -60,
  "Trasporti",
);

const strategyResult: NormalizedTransaction[] = [
  normalizedTx1,
  normalizedTx2,
  normalizedTxWithCategory,
];

const mockStrategy: ImportStrategy = {
  providerType: "test-provider",
  parse: jest.fn().mockReturnValue(strategyResult),
};

const mockTx = new Transaction(
  1,
  -50,
  new Date("2026-01-15"),
  accountId,
  "some notes",
  "abc123def",
);

describe("Transaction - ImportService", () => {
  let importService: ImportService;
  let mockAccountRepository: Mocked<IAccountRepository>;
  let mockTransactionService: Mocked<TransactionService>;
  let mockCategoryService: Mocked<CategoryService>;

  beforeEach(() => {
    mockAccountRepository = mock<IAccountRepository>();
    mockTransactionService = mock<TransactionService>();
    mockCategoryService = mock<CategoryService>();

    // Transactions with a categoryName go through resolveCategory.
    // Make findByDescriptionLike return null so the test must mock create;
    // or return a value so create is never called.
    mockCategoryService.findByDescriptionLike.mockResolvedValue({
      id: 5,
      code: "TRASPORTI",
      description: "Trasporti",
    });

    jest.clearAllMocks();

    importService = new ImportService(
      [mockStrategy],
      mockAccountRepository,
      mockTransactionService,
      mockCategoryService,
    );
  });

  describe("importCsv", () => {
    it("should throw NotFoundException if account not found", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        importService.importCsv(csvFixture, accountId, userFixture.id),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if account has no importProviderType", async () => {
      const accountNoProvider = new Account(
        accountId,
        "No Import",
        0,
        "EUR",
        "checking",
      );
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(
        accountNoProvider,
      );

      await expect(
        importService.importCsv(csvFixture, accountId, userFixture.id),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for unknown provider type", async () => {
      const accountUnknownProvider = new Account(
        accountId,
        "Unknown",
        0,
        "EUR",
        "checking",
        undefined,
        undefined,
        "unknown-provider",
      );
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(
        accountUnknownProvider,
      );

      await expect(
        importService.importCsv(csvFixture, accountId, userFixture.id),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException on CSV parse error", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);

      const badCsv = `"unclosed quote,val2`;
      await expect(
        importService.importCsv(badCsv, accountId, userFixture.id),
      ).rejects.toThrow(BadRequestException);
    });

    it("should skip existing transactions (by fingerprint) and return skipped count", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint.mockResolvedValue(mockTx);

      const result = await importService.importCsv(
        csvFixture,
        accountId,
        userFixture.id,
      );

      expect(result).toEqual({ imported: 0, skipped: 3 });
      expect(mockTransactionService.createTransaction).not.toHaveBeenCalled();
    });

    it("should import all transactions when none are duplicates", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint.mockResolvedValue(null);
      mockTransactionService.createTransaction.mockResolvedValue(mockTx);
      mockCategoryService.findByDescriptionLike.mockResolvedValue(null);
      mockCategoryService.create.mockResolvedValue({
        id: 10,
        code: "TRASPORTI",
        description: "Trasporti",
      });

      const result = await importService.importCsv(
        csvFixture,
        accountId,
        userFixture.id,
      );

      expect(result).toEqual({ imported: 3, skipped: 0 });
      expect(mockTransactionService.createTransaction).toHaveBeenCalledTimes(3);
    });

    it("should skip only duplicate transactions and import new ones", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint
        .mockResolvedValueOnce(mockTx)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockTransactionService.createTransaction.mockResolvedValue(mockTx);
      mockCategoryService.findByDescriptionLike.mockResolvedValue(null);
      mockCategoryService.create.mockResolvedValue({
        id: 10,
        code: "TRASPORTI",
        description: "Trasporti",
      });

      const result = await importService.importCsv(
        csvFixture,
        accountId,
        userFixture.id,
      );

      expect(result).toEqual({ imported: 2, skipped: 1 });
      expect(mockTransactionService.createTransaction).toHaveBeenCalledTimes(2);
    });

    it("should resolve existing category by description", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint.mockResolvedValue(null);
      mockTransactionService.createTransaction.mockResolvedValue(mockTx);
      mockCategoryService.findByDescriptionLike.mockResolvedValue({
        id: 5,
        code: "TRASPORTI",
        description: "Trasporti",
      });

      await importService.importCsv(csvFixture, accountId, userFixture.id);

      expect(mockCategoryService.findByDescriptionLike).toHaveBeenCalledWith(
        "Trasporti",
        userFixture.id,
      );
      expect(mockCategoryService.create).not.toHaveBeenCalled();
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 5 }),
      );
    });

    it("should create new category if not found by description", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint.mockResolvedValue(null);
      mockTransactionService.createTransaction.mockResolvedValue(mockTx);
      mockCategoryService.findByDescriptionLike.mockResolvedValue(null);
      mockCategoryService.create.mockResolvedValue({
        id: 10,
        code: "TRASPORTI",
        description: "Trasporti",
      });

      await importService.importCsv(csvFixture, accountId, userFixture.id);

      expect(mockCategoryService.create).toHaveBeenCalledWith(userFixture.id, {
        code: "TRASPORTI",
        description: "Trasporti",
      });
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 10 }),
      );
    });

    it("should compute fingerprint from amount, date, and description", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionService.findByFingerprint.mockResolvedValue(null);
      mockTransactionService.createTransaction.mockResolvedValue(mockTx);
      mockCategoryService.findByDescriptionLike.mockResolvedValue(null);
      mockCategoryService.create.mockResolvedValue({
        id: 10,
        code: "TRASPORTI",
        description: "Trasporti",
      });

      await importService.importCsv(csvFixture, accountId, userFixture.id);

      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          fingerprint: expect.any(String),
        }),
      );
    });
  });
});
