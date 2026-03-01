import { AccountService } from "../../../src/account/services/account.service";
import Mocked = jest.Mocked;
import { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";

describe("Account - AccountService", () => {
  let accountService: AccountService;

  let mockRepository: Mocked<IAccountRepository>;

  const userId = 1;
  const accountId = 100;
  const mockAccount = {
    id: accountId,
    name: "Test Account",
    description: "Description",
  };

  beforeEach(() => {
    mockRepository = mock<IAccountRepository>();

    accountService = new AccountService(mockRepository);
  });

  describe("getAccount", () => {
    it("should return the account if found and it belongs to the user", async () => {
      mockRepository.findByIdAndUserId.mockResolvedValue(mockAccount);

      const result = await accountService.getAccount(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(
        accountId,
        userId,
      );
    });

    it("should throw NotFoundException if account is not found", async () => {
      mockRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        accountService.getAccount(accountId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAccounts", () => {
    it("should return a list of accounts for the user", async () => {
      const mockAccounts = [mockAccount];
      mockRepository.findByUserId.mockResolvedValue(mockAccounts);

      const result = await accountService.getAccounts(userId);

      expect(result).toEqual(mockAccounts);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe("createAccount", () => {
    it("should call repository create and return the new account id", async () => {
      const createData = {
        name: "New Account",
        description: "New Description",
        userId: userId,
      };
      mockRepository.create.mockResolvedValue(accountId);

      const result = await accountService.createAccount(createData);

      expect(result).toBe(accountId);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });
  });

  describe("removeAccount", () => {
    it("should remove the account if it exists", async () => {
      mockRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockRepository.remove.mockResolvedValue(undefined);

      await accountService.removeAccount(accountId, userId);

      expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(
        accountId,
        userId,
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(accountId);
    });

    it("should throw NotFoundException if the account to remove is not found", async () => {
      mockRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        accountService.removeAccount(accountId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
