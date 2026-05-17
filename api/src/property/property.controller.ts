import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PropertyService } from "./services/property.service";
import { PropertyPresenter } from "./presenters/property.presenter";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/currentUser.decorator";
import type { AuthUser } from "../auth/models/authUser.model";
import type { PropertyType } from "./models/property.model";

@Controller("properties")
@UseGuards(JwtAuthGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      type?: PropertyType;
      address?: string;
      surface?: number;
      purchasePrice?: number;
      purchaseDate?: string;
      currentValue?: number;
      currency?: string;
      description?: string;
    },
  ): Promise<number> {
    return this.propertyService.createProperty({
      ...body,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      userId: user.id,
    });
  }

  @Get()
  async getProperties(
    @CurrentUser() user: AuthUser,
  ): Promise<PropertyPresenter[]> {
    return (await this.propertyService.getProperties(user.id)).map(
      PropertyPresenter.fromModel,
    );
  }

  // IMPORTANT: /summary must be declared before /:id to avoid ParseIntPipe catching "summary"
  @Get("summary")
  async getSummary(@CurrentUser() user: AuthUser) {
    return this.propertyService.getSummary(user.id);
  }

  @Get("/:id")
  async getProperty(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<PropertyPresenter> {
    const property = await this.propertyService.getProperty(id, user.id);
    return PropertyPresenter.fromModel(property);
  }

  @Patch("/:id")
  async updateProperty(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      type?: PropertyType;
      address?: string;
      surface?: number;
      purchasePrice?: number;
      purchaseDate?: string;
      currentValue?: number;
      currency?: string;
      description?: string;
    },
  ): Promise<void> {
    return this.propertyService.updateProperty(id, user.id, {
      ...body,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
    });
  }

  @Delete("/:id")
  async removeProperty(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    return this.propertyService.removeProperty(id, user.id);
  }
}
