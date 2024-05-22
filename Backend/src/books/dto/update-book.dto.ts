import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  titulo: string;

  @IsString()
  @IsOptional()
  editorial: string;

  @IsString()
  @IsOptional()
  autor: string;

  @IsString()
  @IsOptional()
  sinopsis: string;

  @IsString()
  @IsOptional()
  ano_de_publicacion: string;

  @IsString()
  @IsOptional()
  isbn: string;

  @IsBoolean()
  @IsOptional()
  disponible: boolean;
}