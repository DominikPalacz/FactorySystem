import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsInt()
  capacity?: number;
}
