import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  uom?: string;
}
