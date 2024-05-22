import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserImageInsertDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsOptional()
  credencial: boolean;
}
