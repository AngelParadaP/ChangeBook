import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImageTitleDto {
  @IsString()
  @IsOptional()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}