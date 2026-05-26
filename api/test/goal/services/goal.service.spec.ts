import { GoalService } from "../../../src/goal/services/goal.service";
import { IGoalRepository } from "../../../src/goal/repositories/goalRepository.interface";
import { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import { mock } from "jest-mock-extended";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Goal } from "../../../src/goal/models/goal.model";
import Mocked = jest.Mocked;

describe("Goal - GoalService", () => {
  let service: GoalService;
  let mockGoalRepository: Mocked<IGoalRepository>;
  let mockAccountRepository: Mocked<IAccountRepository>;

  const userId = 1;
  const accountId = 10;

  const mockAccount = {
    id: accountId,
    name: "Main Account",
    description: undefined,
    currency: "EUR",
    balance: 0,
    type: "checking" as const,
  };

  const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
    new Goal(
      overrides.id ?? 1,
      overrides.accountId ?? accountId,
      overrides.name ?? "Emergency Fund",
      overrides.target ?? 10000,
      new Date(),
      new Date(),
      overrides.completedAt ?? null,
    );

  beforeEach(() => {
    mockGoalRepository = mock<IGoalRepository>();
    mockAccountRepository = mock<IAccountRepository>();
    service = new GoalService(mockGoalRepository, mockAccountRepository);
  });

  describe("createGoal", () => {
    const baseInput = {
      accountId,
      userId,
      name: "Emergency Fund",
      target: 10000,
    };

    it("should throw BadRequestException for NaN target", async () => {
      await expect(
        service.createGoal({ ...baseInput, target: NaN }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for Infinity target", async () => {
      await expect(
        service.createGoal({ ...baseInput, target: Infinity }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for zero target", async () => {
      await expect(
        service.createGoal({ ...baseInput, target: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for negative target", async () => {
      await expect(
        service.createGoal({ ...baseInput, target: -100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if account does not belong to user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.createGoal(baseInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if a goal with the same name already exists", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockGoalRepository.findByAccountIdAndName.mockResolvedValue(makeGoal());

      await expect(service.createGoal(baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should create the goal when all inputs are valid", async () => {
      const created = makeGoal();
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockGoalRepository.findByAccountIdAndName.mockResolvedValue(null);
      mockGoalRepository.create.mockResolvedValue(created);

      const result = await service.createGoal(baseInput);

      expect(result).toBe(created);
      expect(mockGoalRepository.create).toHaveBeenCalledWith({
        accountId,
        name: "Emergency Fund",
        target: 10000,
      });
    });
  });

  describe("getGoal", () => {
    it("should throw NotFoundException if goal is not found", async () => {
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getGoal(1, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return the goal when found", async () => {
      const goal = makeGoal();
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(goal);

      const result = await service.getGoal(1, userId);

      expect(result).toBe(goal);
    });
  });

  describe("getGoals", () => {
    it("should return all goals for the user", async () => {
      const goals = [makeGoal({ id: 1 }), makeGoal({ id: 2 })];
      mockGoalRepository.findByUserId.mockResolvedValue(goals);

      const result = await service.getGoals(userId);

      expect(result).toBe(goals);
      expect(mockGoalRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe("getGoalsByAccount", () => {
    it("should throw NotFoundException if account does not belong to user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getGoalsByAccount(accountId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return goals for the account", async () => {
      const goals = [makeGoal()];
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockGoalRepository.findByAccountId.mockResolvedValue(goals);

      const result = await service.getGoalsByAccount(accountId, userId);

      expect(result).toBe(goals);
      expect(mockGoalRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });
  });

  describe("updateGoal", () => {
    it("should throw NotFoundException if goal is not found", async () => {
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateGoal(1, userId, { target: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if updated target is invalid", async () => {
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(makeGoal());

      await expect(
        service.updateGoal(1, userId, { target: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if new name already exists in the account", async () => {
      const goal = makeGoal({ name: "Old Name" });
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(goal);
      mockGoalRepository.findByAccountIdAndName.mockResolvedValue(
        makeGoal({ name: "New Name" }),
      );

      await expect(
        service.updateGoal(1, userId, { name: "New Name" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should not check name conflict if the name is unchanged", async () => {
      const goal = makeGoal({ name: "Emergency Fund" });
      const updated = makeGoal();
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(goal);
      mockGoalRepository.update.mockResolvedValue(updated);

      await service.updateGoal(1, userId, { name: "Emergency Fund" });

      expect(mockGoalRepository.findByAccountIdAndName).not.toHaveBeenCalled();
    });

    it("should update the goal when data is valid", async () => {
      const goal = makeGoal();
      const updated = makeGoal({ target: 20000 });
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(goal);
      mockGoalRepository.findByAccountIdAndName.mockResolvedValue(null);
      mockGoalRepository.update.mockResolvedValue(updated);

      const result = await service.updateGoal(1, userId, {
        name: "New Name",
        target: 20000,
      });

      expect(result).toBe(updated);
      expect(mockGoalRepository.update).toHaveBeenCalledWith(1, {
        name: "New Name",
        target: 20000,
      });
    });
  });

  describe("removeGoal", () => {
    it("should throw NotFoundException if goal is not found", async () => {
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.removeGoal(1, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should remove the goal", async () => {
      const goal = makeGoal({ id: 1 });
      mockGoalRepository.findByIdAndUserId.mockResolvedValue(goal);

      await service.removeGoal(1, userId);

      expect(mockGoalRepository.remove).toHaveBeenCalledWith(1);
    });
  });
});
