import { IsArray, IsInt, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CreateOrderItemDto {
  @IsUUID()
  productId: string;
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderReq {
  userId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
