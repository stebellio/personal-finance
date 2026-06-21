import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, dto: CreateCategoryDto) {
    const existing = await this.prismaService.category.findUnique({
      where: { userId_code: { userId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(
        `Category with code "${dto.code}" already exists`,
      );
    }

    return this.prismaService.category.create({
      data: {
        code: dto.code,
        description: dto.description,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prismaService.category.findMany({
      where: { userId },
      orderBy: { code: "asc" },
    });
  }

  async findByDescriptionLike(description: string, userId: number) {
    return this.prismaService.category.findFirst({
      where: {
        userId,
        description: { contains: description },
      },
    });
  }

  async findOne(id: number, userId: number) {
    const category = await this.prismaService.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return category;
  }

  async update(id: number, userId: number, dto: UpdateCategoryDto) {
    await this.findOne(id, userId);

    if (dto.code) {
      const existing = await this.prismaService.category.findUnique({
        where: { userId_code: { userId, code: dto.code } },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Category with code "${dto.code}" already exists`,
        );
      }
    }

    return this.prismaService.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);
    await this.prismaService.category.delete({ where: { id } });
  }
}
