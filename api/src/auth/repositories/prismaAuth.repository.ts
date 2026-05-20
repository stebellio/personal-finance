import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IAuthRepository } from "./authRepository.interface";

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<number> {
    const user = await this.prisma.user.create({
      data,
    });

    return user.id;
  }

  async findById(id: number): Promise<{
    id: number;
    email: string;
  } | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email };
  }

  async findByEmail(email: string): Promise<{
    id: number;
    email: string;
    password: string;
  } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      password: user.password,
    };
  }
}
