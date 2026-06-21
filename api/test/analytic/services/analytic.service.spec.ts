import { AnalyticService } from "../../../src/analytic/services/analytic.service";
import { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import { ITransactionRepository } from "../../../src/transaction/repositories/transactionRepository.interface";
import { mock } from "jest-mock-extended";
import { BadRequestException } from "@nestjs/common";
import { Period } from "../../../src/analytic/enum/period.enum";
import { Account } from "../../../src/account/models/account.model";
import { Transaction } from "../../../src/transaction/models/transaction.model";
import Mocked = jest.Mocked;

const FAKE_NOW = new Date("2026-05-20T12:00:00.000Z");

describe("Analytic - AnalyticService", () => {
  let service: AnalyticService;
  let mockAccountRepository: Mocked<IAccountRepository>;
  let mockTransactionRepository: Mocked<ITransactionRepository>;

  const userId = 1;
  const accountId = 10;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FAKE_NOW);

    mockAccountRepository = mock<IAccountRepository>();
    mockTransactionRepository = mock<ITransactionRepository>();
    service = new AnalyticService(
      mockTransactionRepository,
      mockAccountRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getNetWorthHistory", () => {
    it("should throw BadRequestException for an invalid period value", async () => {
      await expect(
        service.getNetWorthHistory(userId, "INVALID" as Period),
      ).rejects.toThrow(BadRequestException);
    });

    it("should fetch accounts and transactions with the correct date range for TRIMESTRAL", async () => {
      const account = new Account(
        accountId,
        "Test",
        1000,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      expect(mockAccountRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(
        mockTransactionRepository.findByUserIdAndRange,
      ).toHaveBeenCalledWith(
        userId,
        new Date(2026, 2, 1),
        new Date(2026, 5, 0, 23, 59, 59, 999),
      );
    });

    it("should fetch accounts and transactions with the correct date range for SEMESTRAL", async () => {
      const account = new Account(
        accountId,
        "Test",
        1000,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.SEMESTRAL);

      expect(
        mockTransactionRepository.findByUserIdAndRange,
      ).toHaveBeenCalledWith(
        userId,
        new Date(2025, 11, 1),
        new Date(2026, 5, 0, 23, 59, 59, 999),
      );
    });

    it("should fetch accounts and transactions with the correct date range for YEARLY", async () => {
      const account = new Account(
        accountId,
        "Test",
        1000,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.YEARLY);

      expect(
        mockTransactionRepository.findByUserIdAndRange,
      ).toHaveBeenCalledWith(
        userId,
        new Date(2025, 5, 1),
        new Date(2026, 5, 0, 23, 59, 59, 999),
      );
    });

    it("should return all buckets with null amounts when no accounts exist", async () => {
      mockAccountRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(
        userId,
        Period.TRIMESTRAL,
      );

      expect(result).toHaveLength(3);
      expect(result.every((cp) => cp.amount === null)).toBe(true);
    });

    it("should return the correct number of buckets per period", async () => {
      const account = new Account(
        accountId,
        "Test",
        0,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      const trimestral = await service.getNetWorthHistory(
        userId,
        Period.TRIMESTRAL,
      );
      const semestral = await service.getNetWorthHistory(
        userId,
        Period.SEMESTRAL,
      );
      const yearly = await service.getNetWorthHistory(userId, Period.YEARLY);

      expect(trimestral).toHaveLength(3);
      expect(semestral).toHaveLength(6);
      expect(yearly).toHaveLength(12);
    });

    it("should compute balance by subtracting future transactions from current balance", async () => {
      const account = new Account(
        accountId,
        "Test",
        5000,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      const txMarch = new Transaction(
        1,
        -2000,
        new Date("2026-03-15"),
        accountId,
      );
      const txApril = new Transaction(
        2,
        1000,
        new Date("2026-04-10"),
        accountId,
      );

      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([
        txMarch,
        txApril,
      ]);

      const result = await service.getNetWorthHistory(
        userId,
        Period.TRIMESTRAL,
      );

      const feb = result.find((cp) => cp.month === 2 && cp.year === 2026);
      const mar = result.find((cp) => cp.month === 3 && cp.year === 2026);
      const apr = result.find((cp) => cp.month === 4 && cp.year === 2026);

      // month 2 (Mar): bucketEnd=Mar 31, sumAfter=1000, balance=5000-1000=4000
      // month 3 (Apr): bucketEnd=Apr 30, sumAfter=0, balance=5000
      // month 4 (May): bucketEnd=May 31, sumAfter=0, balance=5000
      expect(feb?.amount).toBe(4000);
      expect(mar?.amount).toBe(5000);
      expect(apr?.amount).toBe(5000);
    });

    it("should exclude accounts created after a bucket month", async () => {
      const account = new Account(
        accountId,
        "Test",
        1000,
        "EUR",
        "checking",
        undefined,
        new Date("2026-04-01"),
      );

      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(
        userId,
        Period.TRIMESTRAL,
      );

      const feb = result.find((cp) => cp.month === 2 && cp.year === 2026);
      const mar = result.find((cp) => cp.month === 3 && cp.year === 2026);
      const apr = result.find((cp) => cp.month === 4 && cp.year === 2026);

      // month 2 (Mar): created Apr 1 > Mar 31 → excluded
      // month 3 (Apr): created Apr 1 ≤ Apr 30 → included (1000)
      // month 4 (May): created Apr 1 ≤ May 31 → included (1000)
      expect(feb?.amount).toBe(0);
      expect(mar?.amount).toBe(1000);
      expect(apr?.amount).toBe(1000);
    });

    it("should subtract debit account balances from net worth", async () => {
      const checking = new Account(
        accountId,
        "Checking",
        5000,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      const debit = new Account(
        20,
        "Credit Card",
        2000,
        "EUR",
        "debit",
        undefined,
        new Date("2020-01-01"),
      );

      mockAccountRepository.findByUserId.mockResolvedValue([checking, debit]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(
        userId,
        Period.TRIMESTRAL,
      );

      const first = result[0];
      expect(first?.amount).toBe(3000);
    });

    it("should handle year boundary correctly in YEARLY", async () => {
      const account = new Account(
        accountId,
        "Test",
        0,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(userId, Period.YEARLY);

      const months = result.map((cp) => `${cp.year}-${cp.month}`);
      expect(months).toContain("2025-12");
      expect(months).toContain("2026-1");
    });

    it("should not call transaction repository when no accounts exist", async () => {
      mockAccountRepository.findByUserId.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      expect(
        mockTransactionRepository.findByUserIdAndRange,
      ).not.toHaveBeenCalled();
    });
  });

  describe("getNetWorthProjection", () => {
    it("should calculate projection as last amount plus average monthly change", async () => {
      const account = new Account(
        accountId,
        "Test",
        2400,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      const tx1 = new Transaction(1, 600, new Date("2025-10-15"), accountId);
      const tx2 = new Transaction(2, 600, new Date("2026-01-15"), accountId);

      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([
        tx1,
        tx2,
      ]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.amount).toBe(2500);
    });

    it("should return next calendar month and year", async () => {
      const account = new Account(
        accountId,
        "Test",
        0,
        "EUR",
        "checking",
        undefined,
        new Date("2020-01-01"),
      );
      mockAccountRepository.findByUserId.mockResolvedValue([account]);
      mockTransactionRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.month).toBe(5);
      expect(result.year).toBe(2026);
    });

    it("should return zero projection when no accounts exist", async () => {
      mockAccountRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.amount).toBe(0);
    });
  });
});
