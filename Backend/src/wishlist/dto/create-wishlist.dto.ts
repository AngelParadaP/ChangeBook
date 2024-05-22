import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @IsNotEmpty()
  idLibro: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}
