import { AnalyticService } from "../../../src/analytic/services/analytic.service";
import { IClosureRepository } from "../../../src/closure/repositories/closureRepository.interface";
import { mock } from "jest-mock-extended";
import { BadRequestException } from "@nestjs/common";
import { Period } from "../../../src/analytic/enum/period.enum";
import { Closure } from "../../../src/closure/models/closure.model";
import Mocked = jest.Mocked;

// Fake date: 2026-05-20, getMonth()=4, getFullYear()=2026
// TRIMESTRAL buckets: [(2,2026),(3,2026),(4,2026)]
// SEMESTRAL buckets:  [(11,2025),(12,2025),(1,2026),(2,2026),(3,2026),(4,2026)]
// YEARLY buckets:     [(5,2025),(6,2025),...,(12,2025),(1,2026),(2,2026),(3,2026),(4,2026)]
const FAKE_NOW = new Date("2026-05-20T12:00:00.000Z");

describe("Analytic - AnalyticService", () => {
  let service: AnalyticService;
  let mockClosureRepository: Mocked<IClosureRepository>;

  const userId = 1;
  const accountId = 10;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FAKE_NOW);

    mockClosureRepository = mock<IClosureRepository>();
    service = new AnalyticService(mockClosureRepository);
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

    it("should call the repository with the correct date range for TRIMESTRAL", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      expect(mockClosureRepository.findByUserIdAndRange).toHaveBeenCalledWith(
        userId,
        { year: 2026, month: 2 },
        { year: 2026, month: 4 },
      );
    });

    it("should call the repository with the correct date range for SEMESTRAL", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.SEMESTRAL);

      expect(mockClosureRepository.findByUserIdAndRange).toHaveBeenCalledWith(
        userId,
        { year: 2025, month: 11 },
        { year: 2026, month: 4 },
      );
    });

    it("should call the repository with the correct date range for YEARLY", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      await service.getNetWorthHistory(userId, Period.YEARLY);

      expect(mockClosureRepository.findByUserIdAndRange).toHaveBeenCalledWith(
        userId,
        { year: 2025, month: 5 },
        { year: 2026, month: 4 },
      );
    });

    it("should return all buckets with null amounts when no closures exist", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      expect(result).toHaveLength(3);
      expect(result.every((cp) => cp.amount === null)).toBe(true);
    });

    it("should return the correct number of buckets per period", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      const trimestral = await service.getNetWorthHistory(userId, Period.TRIMESTRAL);
      const semestral = await service.getNetWorthHistory(userId, Period.SEMESTRAL);
      const yearly = await service.getNetWorthHistory(userId, Period.YEARLY);

      expect(trimestral).toHaveLength(3);
      expect(semestral).toHaveLength(6);
      expect(yearly).toHaveLength(12);
    });

    it("should aggregate a closure amount into the matching period bucket", async () => {
      const closure = new Closure(1, 2026, 3, 500, accountId);
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([closure]);

      const result = await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      const march = result.find((cp) => cp.month === 3 && cp.year === 2026);
      expect(march?.amount).toBe(500);
    });

    it("should sum multiple closures that fall in the same period bucket", async () => {
      const closureA = new Closure(1, 2026, 3, 300, accountId);
      const closureB = new Closure(2, 2026, 3, 200, 20);
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([
        closureA,
        closureB,
      ]);

      const result = await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      const march = result.find((cp) => cp.month === 3 && cp.year === 2026);
      expect(march?.amount).toBe(500);
    });

    it("should leave unmatched buckets with null amount", async () => {
      const closure = new Closure(1, 2026, 3, 500, accountId);
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([closure]);

      const result = await service.getNetWorthHistory(userId, Period.TRIMESTRAL);

      const feb = result.find((cp) => cp.month === 2 && cp.year === 2026);
      const apr = result.find((cp) => cp.month === 4 && cp.year === 2026);
      expect(feb?.amount).toBeNull();
      expect(apr?.amount).toBeNull();
    });

    it("should handle the year boundary correctly in YEARLY", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthHistory(userId, Period.YEARLY);

      const months = result.map((cp) => `${cp.year}-${cp.month}`);
      expect(months).toContain("2025-12");
      expect(months).toContain("2026-1");
    });
  });

  describe("getNetWorthProjection", () => {
    it("should calculate projection as last amount plus average monthly change", async () => {
      // First bucket (5,2025) = 1200, last bucket (4,2026) = 2400
      // avg = (2400 - 1200) / 12 = 100
      // prediction = 2400 + 100 = 2500
      const first = new Closure(1, 2025, 5, 1200, accountId);
      const last = new Closure(2, 2026, 4, 2400, accountId);
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([first, last]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.amount).toBe(2500);
    });

    it("should return next calendar month and year", async () => {
      // May 2026 → next month is June 2026 (getMonth()=5)
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.month).toBe(5);
      expect(result.year).toBe(2026);
    });

    it("should return zero projection when all buckets are empty", async () => {
      mockClosureRepository.findByUserIdAndRange.mockResolvedValue([]);

      const result = await service.getNetWorthProjection(userId);

      expect(result.amount).toBe(0);
    });
  });
});
