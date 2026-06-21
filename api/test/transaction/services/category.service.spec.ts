import { CategoryService } from "../../../src/transaction/services/category.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

function createMockPrisma() {
  return {
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as any;
}

const userId = 1;
const categoryId = 10;

const mockCategory = {
  id: categoryId,
  code: "FOOD",
  description: "Food & Groceries",
  userId,
};

describe("Transaction - CategoryService", () => {
  let service: CategoryService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new CategoryService(mockPrisma);
  });

  describe("create", () => {
    const dto = { code: "FOOD", description: "Food & Groceries" };

    it("should throw ConflictException if category code already exists for user", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { userId_code: { userId, code: dto.code } },
      });
    });

    it("should create and return the category", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(userId, dto);

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: { code: dto.code, description: dto.description, userId },
      });
    });
  });

  describe("findAll", () => {
    it("should return all categories for the user ordered by code", async () => {
      const categories = [
        { id: 1, code: "FOOD", description: "Food", userId },
        { id: 2, code: "TRANSPORT", description: "Transport", userId },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll(userId);

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { code: "asc" },
      });
    });
  });

  describe("findByDescriptionLike", () => {
    it("should return the first category matching the description", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findByDescriptionLike("Food", userId);

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { userId, description: { contains: "Food" } },
      });
    });

    it("should return null if no match", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      const result = await service.findByDescriptionLike("XYZ", userId);

      expect(result).toBeNull();
    });
  });

  describe("findOne", () => {
    it("should throw NotFoundException if category not found", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne(categoryId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return the category", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findOne(categoryId, userId);

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: categoryId, userId },
      });
    });
  });

  describe("update", () => {
    it("should throw NotFoundException if category not found", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update(categoryId, userId, { description: "New desc" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if new code already exists for another category", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 99,
        code: "TRANSPORT",
        description: "Transport",
        userId,
      });

      await expect(
        service.update(categoryId, userId, { code: "TRANSPORT" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should not throw when updating with the same code", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue(mockCategory);

      await expect(
        service.update(categoryId, userId, { code: "FOOD" }),
      ).resolves.toEqual(mockCategory);
    });

    it("should update and return the category", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.findUnique.mockResolvedValue(null);
      const updated = { ...mockCategory, description: "Updated description" };
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update(categoryId, userId, {
        description: "Updated description",
      });

      expect(result).toEqual(updated);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { description: "Updated description" },
      });
    });
  });

  describe("remove", () => {
    it("should throw NotFoundException if category not found", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.remove(categoryId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should delete the category", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      await service.remove(categoryId, userId);

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
    });
  });
});
