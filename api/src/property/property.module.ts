import { Module } from "@nestjs/common";
import { PropertyController } from "./property.controller";
import { PropertyService } from "./services/property.service";
import { PROPERTY_REPOSITORY } from "./token";
import { PrismaPropertyRepository } from "./repositories/prismaProperty.repository";

@Module({
  controllers: [PropertyController],
  providers: [
    PropertyService,
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PrismaPropertyRepository,
    },
  ],
})
export class PropertyModule {}
