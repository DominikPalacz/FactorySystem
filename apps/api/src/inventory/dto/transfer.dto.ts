import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class TransferDto {
  @IsUUID()
  @IsNotEmpty()
  fromLocationId!: string;

  @IsUUID()
  @IsNotEmpty()
  toLocationId!: string;

  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  operatorId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
