import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookImageTitleDto {
  @IsString()
  @IsOptional()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}
