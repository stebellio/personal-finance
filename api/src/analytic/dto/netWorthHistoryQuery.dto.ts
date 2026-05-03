import { IsEnum } from "class-validator";
import { Period } from "../enum/period.enum";

export class NetWorthHistoryQueryDto {
  @IsEnum(Period)
  period: Period;
}
