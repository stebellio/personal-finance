import { ClosureService } from "../../../src/closure/services/closure.service";
import { IClosureRepository } from "../../../src/closure/repositories/closureRepository.interface";
import { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import { mock } from "jest-mock-extended";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Closure } from "../../../src/closure/models/closure.model";
import Mocked = jest.Mocked;

describe("Closure - ClosureService", () => {
  let closureService: ClosureService;
  let mockClosureRepository: Mocked<IClosureRepository>;
  let mockAccountRepository: Mocked<IAccountRepository>;

  const userId = 1;
  const accountId = 100;
  const otherAccountId = 200;

  const mockAccount = {
    id: accountId,
    name: "Test Account",
    description: "Description",
    currency: "EUR",
    balance: 100,
    type: "checking" as const,
  };

  const closureApril = new Closure(10, 2026, 4, 250, accountId);
  const closureMarch = new Closure(11, 2026, 3, 180, accountId);

  beforeEach(() => {
    mockClosureRepository = mock<IClosureRepository>();
    mockAccountRepository = mock<IAccountRepository>();
    closureService = new ClosureService(
      mockClosureRepository,
      mockAccountRepository,
    );
  });

  describe("createClosure", () => {
    const baseInput = {
      accountId,
      userId,
      year: 2026,
      month: 4,
      amount: 250,
      note: "April closure",
    };

    it("should throw BadRequestException for invalid month", async () => {
      await expect(
        closureService.createClosure({ ...baseInput, month: 13 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid year", async () => {
      await expect(
        closureService.createClosure({ ...baseInput, year: 1800 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if account does not belong to user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(closureService.createClosure(baseInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if closure already exists for the period", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockClosureRepository.findByAccountAndPeriod.mockResolvedValue(
        closureApril,
      );

      await expect(closureService.createClosure(baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should create closure and update balance when it is the latest", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockClosureRepository.findByAccountAndPeriod.mockResolvedValue(null);
      mockClosureRepository.create.mockResolvedValue(closureApril);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        closureApril,
      );

      const result = await closureService.createClosure(baseInput);

      expect(result).toBe(closureApril);
      expect(mockClosureRepository.create).toHaveBeenCalledWith({
        accountId,
        year: 2026,
        month: 4,
        amount: 250,
        note: "April closure",
      });
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        250,
      );
    });

    it("should create closure WITHOUT updating balance when not the latest", async () => {
      const oldClosure = new Closure(20, 2026, 2, 50, accountId);
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockClosureRepository.findByAccountAndPeriod.mockResolvedValue(null);
      mockClosureRepository.create.mockResolvedValue(oldClosure);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        closureApril,
      );

      const result = await closureService.createClosure({
        ...baseInput,
        year: 2026,
        month: 2,
        amount: 50,
      });

      expect(result).toBe(oldClosure);
      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("should support negative amounts", async () => {
      const negativeClosure = new Closure(30, 2026, 4, -75, accountId);
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockClosureRepository.findByAccountAndPeriod.mockResolvedValue(null);
      mockClosureRepository.create.mockResolvedValue(negativeClosure);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        negativeClosure,
      );

      await closureService.createClosure({ ...baseInput, amount: -75 });

      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        -75,
      );
    });
  });

  describe("getClosure", () => {
    it("should return the closure when found", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureApril);

      const result = await closureService.getClosure(closureApril.id, userId);

      expect(result).toBe(closureApril);
      expect(mockClosureRepository.findByIdAndUserId).toHaveBeenCalledWith(
        closureApril.id,
        userId,
      );
    });

    it("should throw NotFoundException when closure not found or not owned", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        closureService.getClosure(closureApril.id, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getClosuresByAccount", () => {
    it("should throw NotFoundException if account is not owned by user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        closureService.getClosuresByAccount(accountId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return list of closures for the account", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockClosureRepository.findByAccountId.mockResolvedValue([
        closureApril,
        closureMarch,
      ]);

      const result = await closureService.getClosuresByAccount(
        accountId,
        userId,
      );

      expect(result).toEqual([closureApril, closureMarch]);
    });
  });

  describe("getClosuresByPeriod", () => {
    it("should throw BadRequestException for invalid period", async () => {
      await expect(
        closureService.getClosuresByPeriod(userId, 2026, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it("should return closures for the given period and user", async () => {
      mockClosureRepository.findByUserIdAndPeriod.mockResolvedValue([
        closureApril,
      ]);

      const result = await closureService.getClosuresByPeriod(userId, 2026, 4);

      expect(result).toEqual([closureApril]);
      expect(mockClosureRepository.findByUserIdAndPeriod).toHaveBeenCalledWith(
        userId,
        2026,
        4,
      );
    });
  });

  describe("updateClosure", () => {
    it("should throw NotFoundException if closure does not exist", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        closureService.updateClosure(closureApril.id, userId, { amount: 300 }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update closure and balance when it is the latest and amount changes", async () => {
      const updated = new Closure(closureApril.id, 2026, 4, 300, accountId);
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureApril);
      mockClosureRepository.update.mockResolvedValue(updated);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(updated);

      const result = await closureService.updateClosure(
        closureApril.id,
        userId,
        { amount: 300 },
      );

      expect(result).toBe(updated);
      expect(mockClosureRepository.update).toHaveBeenCalledWith(
        closureApril.id,
        { amount: 300 },
      );
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        300,
      );
    });

    it("should NOT update balance when only the note changes", async () => {
      const updated = new Closure(
        closureApril.id,
        2026,
        4,
        closureApril.amount,
        accountId,
        "new note",
      );
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureApril);
      mockClosureRepository.update.mockResolvedValue(updated);

      await closureService.updateClosure(closureApril.id, userId, {
        note: "new note",
      });

      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
      expect(
        mockClosureRepository.findLatestByAccountId,
      ).not.toHaveBeenCalled();
    });

    it("should NOT update balance when amount changes but closure is not the latest", async () => {
      const updated = new Closure(closureMarch.id, 2026, 3, 999, accountId);
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureMarch);
      mockClosureRepository.update.mockResolvedValue(updated);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        closureApril,
      );

      await closureService.updateClosure(closureMarch.id, userId, {
        amount: 999,
      });

      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe("removeClosure", () => {
    it("should throw NotFoundException if closure does not exist", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        closureService.removeClosure(closureApril.id, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should remove closure and rollback balance to previous closure when latest is removed", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureApril);
      mockClosureRepository.findLatestByAccountId
        .mockResolvedValueOnce(closureApril)
        .mockResolvedValueOnce(closureMarch);

      await closureService.removeClosure(closureApril.id, userId);

      expect(mockClosureRepository.remove).toHaveBeenCalledWith(
        closureApril.id,
      );
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        closureMarch.amount,
      );
    });

    it("should remove closure and leave balance unchanged when latest is removed and no closures remain", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureApril);
      mockClosureRepository.findLatestByAccountId
        .mockResolvedValueOnce(closureApril)
        .mockResolvedValueOnce(null);

      await closureService.removeClosure(closureApril.id, userId);

      expect(mockClosureRepository.remove).toHaveBeenCalledWith(
        closureApril.id,
      );
      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("should NOT update balance when removing a non-latest closure", async () => {
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(closureMarch);
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        closureApril,
      );

      await closureService.removeClosure(closureMarch.id, userId);

      expect(mockClosureRepository.remove).toHaveBeenCalledWith(
        closureMarch.id,
      );
      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("should not affect closures of other accounts", async () => {
      const otherAccountClosure = new Closure(77, 2026, 4, 500, otherAccountId);
      mockClosureRepository.findByIdAndUserId.mockResolvedValue(
        otherAccountClosure,
      );
      mockClosureRepository.findLatestByAccountId.mockResolvedValue(
        otherAccountClosure,
      );

      await closureService.removeClosure(otherAccountClosure.id, userId);

      expect(mockClosureRepository.findLatestByAccountId).toHaveBeenCalledWith(
        otherAccountId,
      );
    });
  });
});
