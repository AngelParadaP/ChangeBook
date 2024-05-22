import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  codigo: string;

  @IsOptional()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsInt()
  strikes: number;
}
