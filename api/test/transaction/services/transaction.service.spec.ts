import { TransactionService } from "../../../src/transaction/services/transaction.service";
import { ITransactionRepository } from "../../../src/transaction/repositories/transactionRepository.interface";
import { IAccountRepository } from "../../../src/account/repositories/accountRepository.interface";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Transaction } from "../../../src/transaction/models/transaction.model";
import Mocked = jest.Mocked;

describe("Transaction - TransactionService", () => {
  let transactionService: TransactionService;
  let mockTransactionRepository: Mocked<ITransactionRepository>;
  let mockAccountRepository: Mocked<IAccountRepository>;

  const userId = 1;
  const accountId = 100;
  const otherAccountId = 200;

  const mockAccount = {
    id: accountId,
    name: "Test Account",
    description: "Description",
    currency: "EUR",
    balance: 1000,
    type: "checking" as const,
  };

  const mockOtherAccount = {
    id: otherAccountId,
    name: "Other Account",
    description: "Other Description",
    currency: "EUR",
    balance: 500,
    type: "savings" as const,
  };

  const transaction1 = new Transaction(
    1,
    -150,
    new Date("2026-06-20"),
    accountId,
    "Grocery shopping",
  );

  beforeEach(() => {
    mockTransactionRepository = mock<ITransactionRepository>();
    mockAccountRepository = mock<IAccountRepository>();
    transactionService = new TransactionService(
      mockTransactionRepository,
      mockAccountRepository,
    );
  });

  describe("createTransaction", () => {
    const baseInput = {
      accountId,
      userId,
      amount: -150,
      date: new Date("2026-06-20"),
      note: "Grocery shopping",
    };

    it("should throw NotFoundException if account does not belong to user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        transactionService.createTransaction(baseInput),
      ).rejects.toThrow(NotFoundException);
    });

    it("should create transaction and update account balance", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionRepository.create.mockResolvedValue(transaction1);

      const result = await transactionService.createTransaction(baseInput);

      expect(result).toBe(transaction1);
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        accountId,
        amount: -150,
        date: baseInput.date,
        note: "Grocery shopping",
      });
      // 1000 + (-150) = 850
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        850,
      );
    });
  });

  describe("getTransaction", () => {
    it("should return the transaction when found", async () => {
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(
        transaction1,
      );

      const result = await transactionService.getTransaction(
        transaction1.id,
        userId,
      );

      expect(result).toBe(transaction1);
      expect(mockTransactionRepository.findByIdAndUserId).toHaveBeenCalledWith(
        transaction1.id,
        userId,
      );
    });

    it("should throw NotFoundException when transaction not found or not owned", async () => {
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        transactionService.getTransaction(transaction1.id, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getTransactionsByAccount", () => {
    it("should throw NotFoundException if account is not owned by user", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        transactionService.getTransactionsByAccount(accountId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return list of transactions for the account", async () => {
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionRepository.findByAccountId.mockResolvedValue([
        transaction1,
      ]);

      const result = await transactionService.getTransactionsByAccount(
        accountId,
        userId,
      );

      expect(result).toEqual([transaction1]);
      expect(mockTransactionRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });
  });

  describe("getTransactionsByUser", () => {
    it("should return list of transactions for the user", async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue([transaction1]);

      const result = await transactionService.getTransactionsByUser(userId);

      expect(result).toEqual([transaction1]);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe("updateTransaction", () => {
    it("should throw NotFoundException if transaction does not exist", async () => {
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        transactionService.updateTransaction(transaction1.id, userId, {
          amount: -200,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update transaction and update balance when account is same and amount changes", async () => {
      const updated = new Transaction(
        transaction1.id,
        -200,
        transaction1.date,
        accountId,
        "Updated groceries",
      );
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(
        transaction1,
      );
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);
      mockTransactionRepository.update.mockResolvedValue(updated);

      const result = await transactionService.updateTransaction(
        transaction1.id,
        userId,
        { amount: -200, note: "Updated groceries" },
      );

      expect(result).toBe(updated);
      expect(mockTransactionRepository.update).toHaveBeenCalledWith(
        transaction1.id,
        { amount: -200, note: "Updated groceries" },
      );
      // old balance = 1000
      // old amount = -150
      // new amount = -200
      // delta = new - old = -200 - (-150) = -50
      // new balance = 1000 - 50 = 950 (or 1000 - (-150) + (-200) = 950)
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        950,
      );
    });

    it("should NOT update balance when only note changes", async () => {
      const updated = new Transaction(
        transaction1.id,
        transaction1.amount,
        transaction1.date,
        accountId,
        "Only note updated",
      );
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(
        transaction1,
      );
      mockTransactionRepository.update.mockResolvedValue(updated);

      await transactionService.updateTransaction(transaction1.id, userId, {
        note: "Only note updated",
      });

      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("should update both old and new accounts when accountId changes", async () => {
      const updated = new Transaction(
        transaction1.id,
        -150,
        transaction1.date,
        otherAccountId,
        "Moved transaction",
      );
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(
        transaction1,
      );
      mockAccountRepository.findByIdAndUserId
        .mockResolvedValueOnce(mockAccount) // first call for old account
        .mockResolvedValueOnce(mockOtherAccount); // second call for new account
      mockTransactionRepository.update.mockResolvedValue(updated);

      const result = await transactionService.updateTransaction(
        transaction1.id,
        userId,
        { accountId: otherAccountId },
      );

      expect(result).toBe(updated);
      // old account: balance = 1000, old amount = -150.
      // Rollback old transaction: 1000 - (-150) = 1150
      expect(mockAccountRepository.updateBalance).toHaveBeenNthCalledWith(
        1,
        accountId,
        1150,
      );
      // new account: balance = 500, new amount = -150.
      // Apply transaction: 500 + (-150) = 350
      expect(mockAccountRepository.updateBalance).toHaveBeenNthCalledWith(
        2,
        otherAccountId,
        350,
      );
    });
  });

  describe("removeTransaction", () => {
    it("should throw NotFoundException if transaction does not exist", async () => {
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        transactionService.removeTransaction(transaction1.id, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should remove transaction and rollback account balance", async () => {
      mockTransactionRepository.findByIdAndUserId.mockResolvedValue(
        transaction1,
      );
      mockAccountRepository.findByIdAndUserId.mockResolvedValue(mockAccount);

      await transactionService.removeTransaction(transaction1.id, userId);

      expect(mockTransactionRepository.remove).toHaveBeenCalledWith(
        transaction1.id,
      );
      // balance = 1000, amount = -150.
      // Rollback: 1000 - (-150) = 1150
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        accountId,
        1150,
      );
    });
  });
});
