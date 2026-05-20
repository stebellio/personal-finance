import { PropertyService } from "../../../src/property/services/property.service";
import { IPropertyRepository } from "../../../src/property/repositories/propertyRepository.interface";
import { mock } from "jest-mock-extended";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  Property,
  PropertyCategory,
  PropertyType,
} from "../../../src/property/models/property.model";
import Mocked = jest.Mocked;

describe("Property - PropertyService", () => {
  let service: PropertyService;
  let mockPropertyRepository: Mocked<IPropertyRepository>;

  const userId = 1;

  const makeProperty = (overrides: Partial<Property> = {}): Property =>
    new Property(
      overrides.id ?? 1,
      overrides.name ?? "Villa Roma",
      overrides.type ?? "building",
      overrides.currentValue ?? 250000,
      overrides.currency ?? "EUR",
      new Date(),
      new Date(),
      overrides.userId ?? userId,
      undefined,
      undefined,
      undefined,
      overrides.category ?? "apartment",
    );

  beforeEach(() => {
    mockPropertyRepository = mock<IPropertyRepository>();
    service = new PropertyService(mockPropertyRepository);
  });

  describe("createProperty", () => {
    const baseInput = {
      name: "Villa Roma",
      userId,
      type: "building" as PropertyType,
      category: "apartment" as PropertyCategory,
    };

    it("should throw ConflictException if property name already exists for the user", async () => {
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(
        makeProperty(),
      );

      await expect(service.createProperty(baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw BadRequestException when creating a building without a category", async () => {
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(null);

      await expect(
        service.createProperty({ name: "Villa Roma", userId, type: "building" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create a building with category", async () => {
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(null);
      mockPropertyRepository.create.mockResolvedValue(1);

      const result = await service.createProperty(baseInput);

      expect(result).toBe(1);
      expect(mockPropertyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "building",
          category: "apartment",
        }),
      );
    });

    it("should nullify category and cadastralSubaltern for land type", async () => {
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(null);
      mockPropertyRepository.create.mockResolvedValue(2);

      await service.createProperty({
        name: "Terreno",
        userId,
        type: "land",
        category: "apartment",
        cadastralSubaltern: "SUB-01",
      });

      expect(mockPropertyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "land",
          category: undefined,
          cadastralSubaltern: undefined,
        }),
      );
    });

    it("should default type to building, currentValue to 0, and currency to EUR", async () => {
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(null);
      mockPropertyRepository.create.mockResolvedValue(3);

      await service.createProperty({
        name: "Garage",
        userId,
        category: "garage",
      });

      expect(mockPropertyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "building",
          currentValue: 0,
          currency: "EUR",
        }),
      );
    });
  });

  describe("getProperty", () => {
    it("should throw NotFoundException if property is not found", async () => {
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getProperty(1, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return the property when found", async () => {
      const property = makeProperty();
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(property);

      const result = await service.getProperty(1, userId);

      expect(result).toBe(property);
    });
  });

  describe("getProperties", () => {
    it("should return all properties for the user", async () => {
      const properties = [makeProperty({ id: 1 }), makeProperty({ id: 2 })];
      mockPropertyRepository.findByUserId.mockResolvedValue(properties);

      const result = await service.getProperties(userId);

      expect(result).toBe(properties);
      expect(mockPropertyRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe("getSummary", () => {
    it("should return zeros for a user with no properties", async () => {
      mockPropertyRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result).toEqual({ total: 0, count: 0, byType: [] });
    });

    it("should aggregate totals and count by type", async () => {
      const building1 = makeProperty({ id: 1, currentValue: 100000, type: "building" });
      const building2 = makeProperty({ id: 2, currentValue: 50000, type: "building" });
      const land = makeProperty({ id: 3, currentValue: 30000, type: "land", category: undefined });
      mockPropertyRepository.findByUserId.mockResolvedValue([
        building1,
        building2,
        land,
      ]);

      const result = await service.getSummary(userId);

      expect(result.total).toBe(180000);
      expect(result.count).toBe(3);

      const buildingSummary = result.byType.find((b) => b.type === "building");
      expect(buildingSummary).toEqual({ type: "building", total: 150000, count: 2 });

      const landSummary = result.byType.find((b) => b.type === "land");
      expect(landSummary).toEqual({ type: "land", total: 30000, count: 1 });
    });
  });

  describe("updateProperty", () => {
    it("should throw NotFoundException if property is not found", async () => {
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateProperty(1, userId, { name: "New Name" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if new name already exists for the user", async () => {
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(
        makeProperty({ name: "Old Name" }),
      );
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(
        makeProperty({ name: "New Name" }),
      );

      await expect(
        service.updateProperty(1, userId, { name: "New Name" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw BadRequestException when converting a land property to building without providing a category", async () => {
      // Land has no category; switching to building without supplying one must fail
      const land = new Property(1, "Terreno", "land", 50000, "EUR", new Date(), new Date(), userId);
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(land);

      await expect(
        service.updateProperty(1, userId, { type: "building" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should nullify category and cadastralSubaltern when type is updated to land", async () => {
      const property = makeProperty({ type: "building", category: "apartment" });
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(property);

      await service.updateProperty(1, userId, { type: "land" });

      expect(mockPropertyRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ category: null, cadastralSubaltern: null }),
      );
    });

    it("should update the property when data is valid", async () => {
      const property = makeProperty({ type: "building", category: "apartment" });
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(property);
      mockPropertyRepository.findByUserIdAndName.mockResolvedValue(null);

      await service.updateProperty(1, userId, {
        name: "New Name",
        currentValue: 300000,
      });

      expect(mockPropertyRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "New Name", currentValue: 300000 }),
      );
    });
  });

  describe("removeProperty", () => {
    it("should throw NotFoundException if property is not found", async () => {
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.removeProperty(1, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should remove the property", async () => {
      const property = makeProperty({ id: 1 });
      mockPropertyRepository.findByIdAndUserId.mockResolvedValue(property);

      await service.removeProperty(1, userId);

      expect(mockPropertyRepository.remove).toHaveBeenCalledWith(1);
    });
  });
});
